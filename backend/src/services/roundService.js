import { logger } from '../utils/logger.js'
import { upsertAuctionRound } from '../repositories/documentRepository.js'

/**
 * Record the current auction as a round in the property's history timeline.
 * Rounds are grouped by fingerprint so relistings of the same physical
 * property (new source_id each time, possibly across sources) accumulate into
 * one timeline shown on the detail page.
 *
 * Only auctions with a known date are recorded: the round's identity relies on
 * auction_date, and a date-less round carries no historical signal. Non-fatal.
 */
export async function recordRound({ propertyRowId, property, saleNoticeId = null }) {
  if (!property?.fingerprint || !property.auctionDate) return
  try {
    await upsertAuctionRound({
      fingerprint: property.fingerprint,
      propertyId: propertyRowId,
      source: property.source,
      sourceId: property.sourceId,
      auctionDate: property.auctionDate,
      auctionStart: property.auctionStart,
      reservePrice: property.reservePrice,
      emd: property.emd,
      areaText: property.areaText,
      possession: property.possession,
      outcome: property.status === 'Closed' ? 'closed' : 'scheduled',
      saleNoticeId,
      sourceUrl: property.sourceUrl,
      raw: { title: property.title, subType: property.subType },
    })
  } catch (err) {
    logger.warn(`Failed to record auction round for ${property.source}:${property.sourceId}: ${err.message}`)
  }
}

export default { recordRound }
