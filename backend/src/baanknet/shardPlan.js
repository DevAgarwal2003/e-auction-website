import { fetchListingPage, LISTING_FILTER } from './api.js'
import { config } from '../config/env.js'

/** BAANKNET caps paginated listing totals at this value per query. */
export const DEFAULT_LISTING_CAP = 10_000

const MAX_PRICE = 100_000_000_000

const normalizeMode = (mode) => {
  const m = String(mode || 'auto').toLowerCase()
  if (['off', 'false', '0', 'no'].includes(m)) return 'off'
  if (['on', 'true', '1', 'yes', 'price'].includes(m)) return 'on'
  return 'auto'
}

/**
 * Probe how many listings match a price band for one property type.
 */
export async function probeShardTotal(client, propertyTypeId, priceFrom, priceTo) {
  const filter = {
    ...LISTING_FILTER,
    priceFrom: String(priceFrom),
    priceTo: String(priceTo),
  }
  const { totalCount } = await fetchListingPage(client, {
    propertyTypeId,
    page: 0,
    pageSize: 1,
    filter,
  })
  return Number(totalCount) || 0
}

/**
 * Recursively split a price range until every shard reports fewer than `cap`
 * listings (so pagination can reach them all).
 */
export async function buildPriceShards(client, propertyTypeId, min, max, cap = DEFAULT_LISTING_CAP) {
  const totalCount = await probeShardTotal(client, propertyTypeId, min, max)
  if (!totalCount) return []

  const filter = {
    ...LISTING_FILTER,
    priceFrom: String(min),
    priceTo: String(max),
  }
  const label = `₹${min.toLocaleString('en-IN')}-₹${max.toLocaleString('en-IN')}`

  if (totalCount < cap || min >= max) {
    return [{ filter, label, totalCount }]
  }

  const mid = Math.floor((min + max) / 2)
  const left = await buildPriceShards(client, propertyTypeId, min, mid, cap)
  const right = await buildPriceShards(client, propertyTypeId, mid + 1, max, cap)
  return [...left, ...right]
}

/**
 * Build the listing-query shards for one property type.
 * Returns { entries, meta } where meta is set when price sharding was used.
 */
export async function buildShardsForType(client, propertyTypeId, mode, cap = DEFAULT_LISTING_CAP) {
  const entries = []
  const meta = {}

  if (mode === 'off') {
    entries.push({ propertyTypeId, filter: { ...LISTING_FILTER }, label: 'all', totalCount: null })
    return { entries, meta }
  }

  const nationalTotal = await probeShardTotal(client, propertyTypeId, 0, MAX_PRICE)

  if (mode === 'auto' && nationalTotal < cap) {
    entries.push({
      propertyTypeId,
      filter: { ...LISTING_FILTER },
      label: 'all',
      totalCount: nationalTotal,
    })
    return { entries, meta }
  }

  const shards = await buildPriceShards(client, propertyTypeId, 0, MAX_PRICE, cap)
  const sumTotals = shards.reduce((s, sh) => s + sh.totalCount, 0)
  meta[propertyTypeId] = { nationalTotal, shardCount: shards.length, sumTotals }

  for (const shard of shards) {
    entries.push({ propertyTypeId, ...shard })
  }
  return { entries, meta }
}

/**
 * Resolve shard plan for every property type in the ingest run.
 */
export async function buildIngestShardPlan(client, propertyTypes, mode = config.baanknet.priceShard) {
  const cap = config.baanknet.listingCap
  const resolvedMode = normalizeMode(mode)
  const entries = []
  const meta = {}

  for (const propertyTypeId of propertyTypes) {
    const { entries: typeEntries, meta: typeMeta } = await buildShardsForType(
      client,
      propertyTypeId,
      resolvedMode,
      cap,
    )
    entries.push(...typeEntries)
    Object.assign(meta, typeMeta)
  }

  return { entries, meta, mode: resolvedMode }
}

export default buildIngestShardPlan
