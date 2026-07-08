import { createHash } from 'node:crypto'

const norm = (v) =>
  (v === null || v === undefined ? '' : String(v))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const sha1 = (s) => createHash('sha1').update(s).digest('hex')

/**
 * content_hash: changes whenever any meaningful displayed field changes.
 * Used to detect no-op re-scrapes (skip "updated" churn).
 */
export function contentHash(p) {
  const parts = [
    p.title, p.propertyType, p.subType, p.bank, p.borrowerName, p.branch,
    p.state, p.city, p.locality, p.address, p.pincode,
    p.reservePrice, p.emd, p.bidIncrement,
    p.area, p.areaUnit,
    p.auctionDate, p.auctionStart, p.auctionEnd,
    p.status, p.possession, p.description,
    (p.images || []).join('|'),
    p.priceDropLabel, p.previousReservePrice,
    JSON.stringify(p.auctionHistory || []),
  ]
  return sha1(parts.map(norm).join('||'))
}

/**
 * fingerprint: a normalized identity hash used to catch the SAME real property
 * appearing under different listing IDs / sources. Built from the most
 * identifying, slow-changing attributes (bank, location, price, area, date).
 *
 * Two listings with the same fingerprint are treated as duplicates of one
 * canonical property.
 */
export function fingerprint(p) {
  const parts = [
    norm(p.bank),
    norm(p.city),
    norm(p.locality),
    norm(p.pincode),
    p.reservePrice ?? '',
    p.area ?? '',
    p.auctionDate ?? '',
  ]
  return sha1(parts.join('|'))
}
