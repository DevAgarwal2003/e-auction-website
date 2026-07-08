import pLimit from 'p-limit'
import { config } from '../../config/env.js'
import { logger } from '../../utils/logger.js'
import {
  upsertProperty,
  markDuplicates,
  deactivateStale,
  getExistingSourceIds,
  startRun,
  finishRun,
} from '../../repositories/propertyRepository.js'
import { ingestDocument } from '../../services/documentService.js'
import { recordRound } from '../../services/roundService.js'
import { createClient } from './client.js'
import { crawlListing } from './listing.js'
import { fetchDetail } from './detail.js'
import { normalizeProperty } from './normalize.js'

const SOURCE = 'bankeauctions'
// Which document types are worth persisting (skip bidder annexure forms).
const KEEP_DOCS = new Set(['sale_notice', 'tender', 'corrigendum'])

/**
 * Full ingestion run against bankeauctions.com:
 *   crawl the live-auction DataTable -> fetch each property's detail HTML ->
 *   normalize -> upsert (de-duplicated by source_id) -> mirror sale-notice PDFs
 *   -> record an auction-history round. Detail failures fall back to the
 *   listing card so coverage stays full.
 */
export async function runIngest(options = {}) {
  const cfg = config.bankeauctions
  const maxRecords = options.maxRecords ?? cfg.maxRecords
  const fetchDetails = options.fetchDetails ?? cfg.fetchDetails
  const skipExisting = options.skipExisting ?? cfg.skipExisting

  const client = createClient()
  const limit = pLimit(cfg.concurrency)
  const runStartedAt = new Date().toISOString()
  const runId = await startRun(SOURCE)

  const stats = { pages: 0, seen: 0, skipped: 0, inserted: 0, updated: 0, duplicates: 0, errors: 0 }
  const processed = new Set()
  const existingIds = skipExisting ? await getExistingSourceIds(SOURCE) : null

  logger.info(
    `Starting bankeauctions ingest | maxRecords=${maxRecords || '∞'} fetchDetails=${fetchDetails} skipExisting=${skipExisting} concurrency=${cfg.concurrency}`,
  )

  const ingestCard = async (card) => {
    if (!card.id || processed.has(card.id)) return
    processed.add(card.id)
    stats.seen += 1
    if (existingIds && existingIds.has(card.id)) {
      stats.skipped += 1
      return
    }

    try {
      let detail = null
      if (fetchDetails) {
        try {
          detail = await fetchDetail(client, card)
        } catch (err) {
          logger.warn(`  Detail fetch failed for ${card.id}: ${err.message}`)
        }
      }

      const property = normalizeProperty({ card, detail })
      if (!property.sourceId) return

      const { id: propertyRowId, action } = await upsertProperty(property)
      stats[action] += 1

      // Persist + (optionally) mirror sale-notice / tender documents.
      let saleNoticeId = null
      for (const doc of property.documents || []) {
        if (!KEEP_DOCS.has(doc.docType)) continue
        const docId = await ingestDocument({
          propertyId: propertyRowId,
          sourceUrl: doc.url,
          docType: doc.docType,
          label: doc.label,
        })
        if (docId && !saleNoticeId && (doc.docType === 'sale_notice' || doc.docType === 'tender')) {
          saleNoticeId = docId
        }
      }

      await recordRound({ propertyRowId, property, saleNoticeId })
    } catch (err) {
      stats.errors += 1
      logger.warn(`  Failed to ingest bankeauctions property ${card.id}: ${err.message}`)
    }
  }

  try {
    await crawlListing(client, { maxRecords }, async (cards, meta) => {
      stats.pages += 1
      logger.info(`  page ${meta.page} (offset ${meta.start}) -> ${cards.length} rows (total ${meta.totalCount})`)
      await Promise.all(cards.map((card) => limit(() => ingestCard(card))))
    })

    stats.duplicates = await markDuplicates()
    const deactivated = skipExisting ? 0 : await deactivateStale(SOURCE, runStartedAt)

    await finishRun(runId, { status: 'success', stats })
    logger.info(
      `bankeauctions ingest complete | seen=${stats.seen} skipped=${stats.skipped} inserted=${stats.inserted} updated=${stats.updated} duplicates=${stats.duplicates} deactivated=${deactivated} errors=${stats.errors}`,
    )
    return { ...stats, deactivated }
  } catch (err) {
    await finishRun(runId, { status: 'failed', stats, message: err.message })
    throw err
  }
}

export default runIngest
