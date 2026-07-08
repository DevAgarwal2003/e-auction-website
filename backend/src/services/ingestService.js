import pLimit from 'p-limit'
import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { BaanknetClient } from '../baanknet/client.js'
import { crawlListing, fetchPropertyDetail, fetchPropertyImages, PROPERTY_TYPES } from '../baanknet/api.js'
import { buildIngestShardPlan } from '../baanknet/shardPlan.js'
import { normalizeProperty } from '../baanknet/normalize.js'
import {
  upsertProperty,
  markDuplicates,
  deactivateStale,
  getExistingSourceIds,
  startRun,
  finishRun,
} from '../repositories/propertyRepository.js'
import { recordRound } from './roundService.js'

const SOURCE = 'baanknet'

/**
 * Full ingestion run against the BAANKNET JSON API:
 *   list the entire property catalog per property type -> fetch each property's
 *   full detail + images -> normalize -> upsert (de-duplicated by source_id) ->
 *   mark cross-dupes. When a detail fetch fails or fetchDetails is off, the
 *   (already rich) listing card is ingested on its own so coverage stays full.
 *
 * When price sharding is enabled (`BAANKNET_PRICE_SHARD=auto|on`), types that hit
 * the API's 10k listing cap are crawled in adaptive price bands so the full
 * catalog (e.g. ~51k Residential) can be reached.
 */
export async function runIngest(options = {}) {
  const propertyTypes = options.propertyTypes || config.baanknet.propertyTypes
  const maxPages = options.maxPages ?? config.baanknet.maxPagesPerType
  const pageSize = options.pageSize ?? config.baanknet.pageSize
  const fetchDetails = options.fetchDetails ?? config.baanknet.fetchDetails
  const skipExisting = options.skipExisting ?? config.baanknet.skipExisting
  const priceShard = options.priceShard ?? config.baanknet.priceShard

  const client = new BaanknetClient()
  const limit = pLimit(config.baanknet.concurrency)
  const runStartedAt = new Date().toISOString()
  const runId = await startRun(SOURCE)

  const stats = { pages: 0, seen: 0, skipped: 0, inserted: 0, updated: 0, duplicates: 0, errors: 0, shards: 0 }
  // The same property can appear in multiple price bands; de-dupe per run.
  const processed = new Set()

  const existingIds = skipExisting ? await getExistingSourceIds(SOURCE) : null
  if (skipExisting) {
    logger.info(`Resume mode: ${existingIds.size} existing listings will be skipped`)
  }

  logger.info(
    `Starting baanknet ingest | types=${propertyTypes.map((t) => `${t}:${PROPERTY_TYPES[t] || '?'}`).join(',')} maxPages=${maxPages || '∞'} pageSize=${pageSize} fetchDetails=${fetchDetails} skipExisting=${skipExisting} priceShard=${priceShard} concurrency=${config.baanknet.concurrency}`,
  )

  const ingestCard = async (card, propertyTypeId) => {
    const id = String(card.propertyId || '').trim()
    if (!id || processed.has(id)) return
    processed.add(id)
    stats.seen += 1

    if (existingIds && existingIds.has(id)) {
      stats.skipped += 1
      return
    }

    try {
      let detail = null
      let images = []
      if (fetchDetails) {
        try {
          detail = await fetchPropertyDetail(client, id)
          images = await fetchPropertyImages(client, id)
        } catch (err) {
          logger.warn(`  Detail fetch failed for ${id}, using listing card: ${err.message}`)
        }
      }
      const property = normalizeProperty({
        detail,
        card,
        images,
        propertyTypeId,
      })
      if (!property.sourceId) {
        logger.warn(`Skipping property without an id (bank ref ${card.bankPropertyId || '?'})`)
        return
      }
      const { id: propertyRowId, action } = await upsertProperty(property)
      stats[action] += 1
      await recordRound({ propertyRowId, property })
    } catch (err) {
      stats.errors += 1
      logger.warn(`  Failed to ingest property ${id}: ${err.message}`)
    }
  }

  try {
    const { entries: shardPlan, meta: shardMeta, mode: shardMode } = await buildIngestShardPlan(
      client,
      propertyTypes,
      priceShard,
    )
    stats.shards = shardPlan.length

    if (shardMode !== 'off') {
      for (const [typeId, info] of Object.entries(shardMeta)) {
        const name = PROPERTY_TYPES[typeId] || typeId
        logger.info(
          `  Price shards for ${name}: ${info.shardCount} bands covering ~${info.sumTotals} listings (API reports ${info.nationalTotal} for national query)`,
        )
      }
    }
    logger.info(`Listing plan: ${shardPlan.length} quer${shardPlan.length === 1 ? 'y' : 'ies'} across ${propertyTypes.length} type(s)`)

    for (const shard of shardPlan) {
      const typeName = PROPERTY_TYPES[shard.propertyTypeId] || shard.propertyTypeId
      const shardLabel = shard.label === 'all' ? 'all prices' : shard.label
      const totalHint = shard.totalCount != null ? ` ~${shard.totalCount}` : ''
      logger.info(`  [${typeName}] shard ${shardLabel}${totalHint}`)

      await crawlListing(
        client,
        {
          propertyTypeId: shard.propertyTypeId,
          pageSize,
          maxPages,
          filter: shard.filter,
        },
        async (items, meta) => {
          stats.pages += 1
          logger.info(
            `  [${typeName}] ${shardLabel} page ${meta.page} -> ${items.length} properties (total ${meta.totalCount})`,
          )

          await Promise.all(
            items.map((card) => limit(() => ingestCard(card, shard.propertyTypeId))),
          )
        },
      )
    }

    stats.duplicates = await markDuplicates()
    const deactivated = skipExisting ? 0 : await deactivateStale(SOURCE, runStartedAt)

    await finishRun(runId, { status: 'success', stats })
    logger.info(
      `Ingest complete | seen=${stats.seen} skipped=${stats.skipped} inserted=${stats.inserted} updated=${stats.updated} duplicates=${stats.duplicates} deactivated=${deactivated} errors=${stats.errors} shards=${stats.shards}`,
    )
    return { ...stats, deactivated }
  } catch (err) {
    await finishRun(runId, { status: 'failed', stats, message: err.message })
    throw err
  }
}
