import { query } from '../db/pool.js'

/**
 * Upsert a document row (sale notice / tender / annexure) for a property,
 * keyed by (property_id, doc_type, source_url). Returns the row id. Existing
 * storage metadata is preserved unless new values are supplied.
 */
export async function upsertDocument(doc) {
  const sql = `
    INSERT INTO property_documents
      (property_id, doc_type, label, source_url, storage_key, file_name,
       mime_type, byte_size, content_hash, status, fetched_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (property_id, doc_type, source_url) DO UPDATE SET
      label        = COALESCE(EXCLUDED.label, property_documents.label),
      storage_key  = COALESCE(EXCLUDED.storage_key, property_documents.storage_key),
      file_name    = COALESCE(EXCLUDED.file_name, property_documents.file_name),
      mime_type    = COALESCE(EXCLUDED.mime_type, property_documents.mime_type),
      byte_size    = COALESCE(EXCLUDED.byte_size, property_documents.byte_size),
      content_hash = COALESCE(EXCLUDED.content_hash, property_documents.content_hash),
      status       = EXCLUDED.status,
      fetched_at   = COALESCE(EXCLUDED.fetched_at, property_documents.fetched_at)
    RETURNING id
  `
  const { rows } = await query(sql, [
    doc.propertyId,
    doc.docType || 'sale_notice',
    doc.label || null,
    doc.sourceUrl || null,
    doc.storageKey || null,
    doc.fileName || null,
    doc.mimeType || null,
    doc.byteSize || null,
    doc.contentHash || null,
    doc.status || 'pending',
    doc.fetchedAt || null,
  ])
  return rows[0]?.id
}

/** Mark a document as stored (mirrored to object storage). */
export async function markDocumentStored(id, { storageKey, byteSize, mimeType, contentHash }) {
  await query(
    `UPDATE property_documents
       SET storage_key = $2, byte_size = COALESCE($3, byte_size),
           mime_type = COALESCE($4, mime_type), content_hash = COALESCE($5, content_hash),
           status = 'stored', fetched_at = now()
     WHERE id = $1`,
    [id, storageKey, byteSize || null, mimeType || null, contentHash || null],
  )
}

export async function markDocumentStatus(id, status) {
  await query(`UPDATE property_documents SET status = $2 WHERE id = $1`, [id, status])
}

/** The primary downloadable sale notice for a property (prefers stored copies). */
export async function getSaleNotice(propertyId) {
  const { rows } = await query(
    `SELECT * FROM property_documents
     WHERE property_id = $1 AND doc_type IN ('sale_notice', 'tender')
     ORDER BY (storage_key IS NOT NULL) DESC,
              (doc_type = 'sale_notice') DESC,
              id ASC
     LIMIT 1`,
    [propertyId],
  )
  return rows[0] || null
}

/** All documents for a property, for API responses. */
export async function getDocumentsForProperty(propertyId) {
  const { rows } = await query(
    `SELECT id, doc_type, label, source_url, storage_key, file_name, status
     FROM property_documents WHERE property_id = $1 ORDER BY id ASC`,
    [propertyId],
  )
  return rows
}

/**
 * Record (or refresh) one auction round for a physical property, keyed by
 * (fingerprint, source, source_id, auction_date). Idempotent across re-scrapes.
 */
export async function upsertAuctionRound(round) {
  const sql = `
    INSERT INTO auction_rounds
      (fingerprint, property_id, source, source_id, round_no, auction_date,
       auction_start, reserve_price, emd, area_text, possession, outcome,
       sale_notice_id, source_url, raw)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    ON CONFLICT (fingerprint, source, source_id, auction_date) DO UPDATE SET
      property_id    = EXCLUDED.property_id,
      reserve_price  = EXCLUDED.reserve_price,
      emd            = EXCLUDED.emd,
      area_text      = COALESCE(EXCLUDED.area_text, auction_rounds.area_text),
      possession     = COALESCE(EXCLUDED.possession, auction_rounds.possession),
      outcome        = COALESCE(EXCLUDED.outcome, auction_rounds.outcome),
      sale_notice_id = COALESCE(EXCLUDED.sale_notice_id, auction_rounds.sale_notice_id),
      source_url     = COALESCE(EXCLUDED.source_url, auction_rounds.source_url),
      auction_start  = COALESCE(EXCLUDED.auction_start, auction_rounds.auction_start)
    RETURNING id
  `
  const { rows } = await query(sql, [
    round.fingerprint,
    round.propertyId || null,
    round.source,
    round.sourceId || null,
    round.roundNo || null,
    round.auctionDate || null,
    round.auctionStart || null,
    round.reservePrice || null,
    round.emd || null,
    round.areaText || null,
    round.possession || null,
    round.outcome || null,
    round.saleNoticeId || null,
    round.sourceUrl || null,
    JSON.stringify(round.raw ?? {}),
  ])
  return rows[0]?.id
}

/**
 * All auction rounds for the physical property identified by `fingerprint`,
 * newest first. Drives the "Auction history" section on the detail page.
 */
export async function getAuctionRounds(fingerprint) {
  if (!fingerprint) return []
  const { rows } = await query(
    `SELECT ar.*, pd.storage_key AS notice_storage_key, pd.source_url AS notice_source_url
       FROM auction_rounds ar
       LEFT JOIN property_documents pd ON pd.id = ar.sale_notice_id
      WHERE ar.fingerprint = $1
      ORDER BY ar.auction_date DESC NULLS LAST, ar.id DESC`,
    [fingerprint],
  )
  return rows
}
