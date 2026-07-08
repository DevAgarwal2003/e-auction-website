import { query } from '../db/pool.js'

// Order of columns used by the upsert. `id`, `first_seen`, `last_seen`,
// `updated_at`, `duplicate_of`, `is_active` are managed separately.
const COLUMNS = [
  'source', 'source_id', 'source_url', 'title', 'property_type', 'sub_type',
  'category_slug', 'bank', 'borrower_name', 'branch', 'state', 'city',
  'locality', 'address', 'pincode', 'reserve_price', 'emd', 'bid_increment',
  'area', 'area_unit', 'area_text', 'auction_date', 'auction_start',
  'auction_end', 'emd_submission', 'status', 'possession', 'images',
  'description', 'price_drop_label', 'previous_reserve_price', 'auction_history',
  'content_hash', 'fingerprint', 'raw',
]

const toRow = (p) => [
  p.source, p.sourceId, p.sourceUrl, p.title, p.propertyType, p.subType,
  p.categorySlug, p.bank, p.borrowerName, p.branch, p.state, p.city,
  p.locality, p.address, p.pincode, p.reservePrice, p.emd, p.bidIncrement,
  p.area, p.areaUnit, p.areaText, p.auctionDate, p.auctionStart,
  p.auctionEnd, p.emdSubmission, p.status, p.possession, JSON.stringify(p.images || []),
  p.description, p.priceDropLabel, p.previousReservePrice,
  JSON.stringify(p.auctionHistory || []),
  p.contentHash, p.fingerprint, JSON.stringify(p.raw ?? {}),
]

/**
 * Insert or update a property keyed by (source, source_id).
 * Returns 'inserted' | 'updated'. last_seen is always refreshed; updated_at
 * only advances when the meaningful content actually changed.
 */
export async function upsertProperty(p) {
  if (!p.sourceId) throw new Error('Cannot upsert property without sourceId')

  const cols = COLUMNS.join(', ')
  const placeholders = COLUMNS.map((_, i) => `$${i + 1}`).join(', ')

  // Build "col = EXCLUDED.col" for every column except the natural key.
  const updates = COLUMNS.filter((c) => c !== 'source' && c !== 'source_id')
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(', ')

  const sql = `
    INSERT INTO properties (${cols})
    VALUES (${placeholders})
    ON CONFLICT (source, source_id) DO UPDATE SET
      ${updates},
      last_seen = now(),
      is_active = TRUE,
      updated_at = CASE
        WHEN properties.content_hash IS DISTINCT FROM EXCLUDED.content_hash
        THEN now() ELSE properties.updated_at END
    RETURNING id, (xmax = 0) AS inserted
  `
  const { rows } = await query(sql, toRow(p))
  return { id: rows[0]?.id, action: rows[0]?.inserted ? 'inserted' : 'updated' }
}

/**
 * Load the set of source_ids already stored for a source. Used to resume an
 * interrupted run without re-fetching detail pages we already have.
 */
export async function getExistingSourceIds(source) {
  const { rows } = await query(
    `SELECT source_id FROM properties WHERE source = $1`,
    [source],
  )
  const set = new Set()
  for (const r of rows) if (r.source_id) set.add(String(r.source_id))
  return set
}

/**
 * Cross-listing de-duplication pass.
 * For every group of rows sharing a fingerprint, keep the lowest id as the
 * canonical record and point the rest at it via duplicate_of (hiding them from
 * public listings). Returns the number of rows newly marked as duplicates.
 */
export async function markDuplicates() {
  const sql = `
    WITH ranked AS (
      SELECT id,
             fingerprint,
             MIN(id) OVER (PARTITION BY fingerprint) AS canonical_id
      FROM properties
      WHERE fingerprint IS NOT NULL
    )
    UPDATE properties p
    SET duplicate_of = r.canonical_id
    FROM ranked r
    WHERE p.id = r.id
      AND r.id <> r.canonical_id
      AND p.duplicate_of IS DISTINCT FROM r.canonical_id
  `
  const res = await query(sql)
  return res.rowCount
}

/** Mark listings from this source that weren't seen in the latest run as inactive. */
export async function deactivateStale(source, beforeISO) {
  const sql = `
    UPDATE properties
    SET is_active = FALSE
    WHERE source = $1 AND last_seen < $2 AND is_active = TRUE
  `
  const res = await query(sql, [source, beforeISO])
  return res.rowCount
}

// --- Scrape-run audit -------------------------------------------------------
export async function startRun(source) {
  const { rows } = await query(
    `INSERT INTO scrape_runs (source, status) VALUES ($1, 'running') RETURNING id`,
    [source],
  )
  return rows[0].id
}

export async function finishRun(id, { status, stats = {}, message = null }) {
  await query(
    `UPDATE scrape_runs SET
        finished_at = now(), status = $2,
        pages_scraped = $3, seen = $4, inserted = $5, updated = $6,
        duplicates = $7, errors = $8, message = $9
     WHERE id = $1`,
    [
      id, status,
      stats.pages || 0, stats.seen || 0, stats.inserted || 0,
      stats.updated || 0, stats.duplicates || 0, stats.errors || 0, message,
    ],
  )
}
