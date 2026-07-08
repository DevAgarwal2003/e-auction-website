import { query } from '../db/pool.js'
import { resolveState, citiesForState, toCanonicalState } from '../utils/indianStates.js'
import { getAuctionRounds, getSaleNotice } from './documentRepository.js'

// Budget brackets — mirror the frontend's budgetRanges (index-based).
export const BUDGET_RANGES = [
  { min: 0, max: 2500000 },
  { min: 2500000, max: 5000000 },
  { min: 5000000, max: 10000000 },
  { min: 10000000, max: 20000000 },
  { min: 20000000, max: 50000000 },
  { min: 50000000, max: null },
]

// Map a DB row to the camelCase shape the React frontend already expects.
export function mapRow(r) {
  return {
    id: r.source_id || String(r.id),
    dbId: r.id,
    source: r.source,
    title: r.title,
    propertyType: r.property_type,
    subType: r.sub_type,
    bank: r.bank,
    borrowerName: r.borrower_name,
    branch: r.branch,
    state: resolveState(r.state, r.city),
    city: r.city,
    locality: r.locality,
    address: r.address,
    pincode: r.pincode,
    reservePrice: r.reserve_price,
    emd: r.emd,
    bidIncrement: r.bid_increment,
    area: r.area,
    areaUnit: r.area_unit,
    auctionDate: r.auction_date ? r.auction_date.toISOString().slice(0, 10) : null,
    auctionStartTime: r.auction_start ? r.auction_start.toISOString() : null,
    auctionEndTime: r.auction_end ? r.auction_end.toISOString() : null,
    emdSubmission: r.emd_submission ? r.emd_submission.toISOString() : null,
    status: r.status,
    possession: r.possession,
    images: Array.isArray(r.images) ? r.images : [],
    description: r.description,
    sourceUrl: r.source_url,
    priceDropLabel: r.price_drop_label,
    priceDropPercent: r.price_drop_label
      ? (() => {
          const m = String(r.price_drop_label).match(/(\d+(?:\.\d+)?)\s*%\s*drop/i)
          return m ? parseFloat(m[1]) : null
        })()
      : null,
    previousReservePrice: r.previous_reserve_price,
    auctionHistory: Array.isArray(r.auction_history) ? r.auction_history : [],
  }
}

const SORTS = {
  relevance: `CASE status WHEN 'Live' THEN 0 WHEN 'Upcoming' THEN 1 ELSE 2 END ASC, last_seen DESC`,
  'price-asc': `reserve_price ASC NULLS LAST`,
  'price-desc': `reserve_price DESC NULLS LAST`,
  date: `auction_date ASC NULLS LAST`,
  newest: `first_seen DESC`,
}

/**
 * Filtered, paginated property search. Only canonical, active rows are returned
 * (duplicate_of IS NULL AND is_active).
 */
export async function findProperties(filters = {}) {
  const {
    state, city, locality, type, bank, status, keyword,
    budget, sort = 'relevance',
  } = filters
  const page = Math.max(1, parseInt(filters.page, 10) || 1)
  const limit = Math.min(60, Math.max(1, parseInt(filters.limit, 10) || 12))
  const offset = (page - 1) * limit

  const where = ['duplicate_of IS NULL', 'is_active = TRUE']
  const params = []
  const add = (clause, value) => {
    params.push(value)
    where.push(clause.replace('?', `$${params.length}`))
  }

  if (state) {
    const canon = toCanonicalState(state) || state
    params.push(canon.toLowerCase())
    const canonIdx = params.length
    const clauses = [
      `LOWER(REGEXP_REPLACE(TRIM(BOTH '.' FROM TRIM(COALESCE(state, ''))), E'\\\\s+', ' ', 'g')) = $${canonIdx}`,
    ]
    const cities = citiesForState(canon)
    if (cities.length) {
      params.push(cities)
      clauses.push(`LOWER(TRIM(COALESCE(city, ''))) = ANY($${params.length}::text[])`)
    }
    where.push(`(${clauses.join(' OR ')})`)
  }
  if (city) add('city = ?', city)
  if (locality) add('locality = ?', locality)
  if (type) add('property_type = ?', type)
  if (bank) add('bank = ?', bank)
  if (status) add('status = ?', status)

  if (budget !== undefined && budget !== '' && budget !== null) {
    const range = BUDGET_RANGES[Number(budget)]
    if (range) {
      add('reserve_price >= ?', range.min)
      if (range.max != null) add('reserve_price <= ?', range.max)
    }
  }

  if (keyword) {
    params.push(`%${keyword}%`)
    const idx = params.length
    where.push(
      `(title ILIKE $${idx} OR locality ILIKE $${idx} OR city ILIKE $${idx} OR address ILIKE $${idx} OR bank ILIKE $${idx})`,
    )
  }

  const whereSql = where.join(' AND ')
  const orderSql = SORTS[sort] || SORTS.relevance

  const countSql = `SELECT COUNT(*)::int AS total FROM properties WHERE ${whereSql}`
  const { rows: countRows } = await query(countSql, params)
  const total = countRows[0]?.total || 0

  const dataSql = `
    SELECT * FROM properties
    WHERE ${whereSql}
    ORDER BY ${orderSql}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `
  const { rows } = await query(dataSql, [...params, limit, offset])

  return {
    total,
    page,
    limit,
    pageCount: Math.ceil(total / limit),
    results: rows.map(mapRow),
  }
}

// Map an auction_rounds row into the frontend's auctionHistory shape.
function mapRound(r) {
  return {
    auctionId: r.source_id || String(r.id),
    source: r.source,
    auctionDate: r.auction_date ? r.auction_date.toISOString().slice(0, 10) : null,
    reservePrice: r.reserve_price,
    area: r.area_text || null,
    possession: r.possession || null,
    outcome: r.outcome || null,
    saleNoticeUrl:
      r.notice_storage_key || r.notice_source_url
        ? `/api/properties/${encodeURIComponent(r.source_id || r.id)}/sale-notice`
        : null,
  }
}

export async function getPropertyById(id) {
  // Accept either the source_id (baanknet propertyDetailId) or the internal db id.
  const { rows } = await query(
    `SELECT * FROM properties
     WHERE source_id = $1 OR (id::text = $1)
     ORDER BY duplicate_of NULLS FIRST
     LIMIT 1`,
    [String(id)],
  )
  if (!rows[0]) return null
  const row = rows[0]
  const property = mapRow(row)

  // Build the auction-history timeline from every round sharing this property's
  // fingerprint (relistings across time / sources), excluding the current round.
  const rounds = await getAuctionRounds(row.fingerprint)
  property.auctionHistory = rounds
    .filter((r) => !(String(r.source_id) === String(row.source_id) && r.source === row.source))
    .map(mapRound)

  // Expose a download link for the stored/proxied sale notice, if any.
  const notice = await getSaleNotice(row.id)
  property.saleNoticeUrl = notice
    ? `/api/properties/${encodeURIComponent(property.id)}/sale-notice`
    : null
  property.hasSaleNotice = Boolean(notice)

  return property
}

export async function getSimilar(property, n = 3) {
  if (!property) return []
  const { rows } = await query(
    `SELECT * FROM properties
     WHERE duplicate_of IS NULL AND is_active = TRUE
       AND property_type = $1 AND source_id <> $2
     ORDER BY (city = $3) DESC, last_seen DESC
     LIMIT $4`,
    [property.propertyType, property.id, property.city, n],
  )
  return rows.map(mapRow)
}

/** Distinct filter options derived from the live data (drives frontend dropdowns). */
export async function getFilterMeta() {
  const base = 'FROM properties WHERE duplicate_of IS NULL AND is_active = TRUE'

  const [locRes, typesRes, banksRes, statusRes] = await Promise.all([
    query(`SELECT DISTINCT state, city, locality ${base} AND city IS NOT NULL`),
    query(`SELECT property_type, COUNT(*)::int AS count ${base} AND property_type IS NOT NULL GROUP BY property_type ORDER BY count DESC`),
    query(`SELECT DISTINCT bank ${base} AND bank IS NOT NULL ORDER BY bank`),
    query(`SELECT status, COUNT(*)::int AS count ${base} GROUP BY status`),
  ])

  // Build nested canonical state -> city -> [localities] (ignore junk in raw state column).
  const stateSet = new Set()
  const locations = {}
  for (const { state: rawState, city, locality } of locRes.rows) {
    const st = resolveState(rawState, city)
    if (!st || !city) continue
    stateSet.add(st)
    locations[st] ??= {}
    locations[st][city] ??= new Set()
    if (locality) locations[st][city].add(locality)
  }
  const locationsObj = {}
  for (const [st, cities] of Object.entries(locations)) {
    locationsObj[st] = {}
    for (const [c, set] of Object.entries(cities)) {
      locationsObj[st][c] = [...set].sort()
    }
  }

  return {
    states: [...stateSet].sort(),
    locations: locationsObj,
    propertyTypes: typesRes.rows.map((r) => ({ type: r.property_type, count: r.count })),
    banks: banksRes.rows.map((r) => r.bank),
    statuses: statusRes.rows.map((r) => ({ status: r.status, count: r.count })),
  }
}

/** Headline counts for the homepage stats band. */
export async function getStats() {
  const base = 'FROM properties WHERE duplicate_of IS NULL AND is_active = TRUE'
  const [totals, byType, upcoming] = await Promise.all([
    query(`SELECT COUNT(*)::int AS total, COALESCE(SUM(reserve_price),0)::bigint AS value ${base}`),
    query(`SELECT property_type AS type, COUNT(*)::int AS count ${base} AND property_type IS NOT NULL GROUP BY property_type ORDER BY count DESC`),
    query(`SELECT COUNT(*)::int AS count ${base} AND status = 'Upcoming'`),
  ])
  return {
    totalProperties: totals.rows[0].total,
    totalValue: Number(totals.rows[0].value),
    upcomingAuctions: upcoming.rows[0].count,
    byType: byType.rows,
  }
}
