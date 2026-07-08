import { config } from '../../config/env.js'
import { logger } from '../../utils/logger.js'

// Position of each field within a `liveAuctionDatatable` row array. The site's
// DataTable declares these via its sColumns:
//   b.logopath, a.id, b.name, pro.product_description, city_name, bid_last_date,
//   a.reserve_price, a.emd_amt, UPPER(a.event_type), drt_name, a.productID,
//   a.dsc_enabled, cat_name, scat_name, pro.prospect_number
export const COL = {
  logo: 0,
  id: 1,
  bank: 2,
  description: 3,
  city: 4,
  bidLastDate: 5,
  reservePrice: 6,
  emd: 7,
  eventType: 8,
  drtName: 9,
  productId: 10,
  dscEnabled: 11,
  category: 12,
  subType: 13,
  prospectNumber: 14,
}

const N_COLS = 15
const LISTING_PATH = '/home/liveAuctionDatatable/?tmpAct=1'

// Build the legacy (DataTables 1.9) server-side request body. The endpoint
// ignores loose params; it only paginates when the full aoData payload is sent.
function buildAoData({ start, length, echo }) {
  const form = {
    sEcho: echo,
    iColumns: N_COLS,
    sColumns: '',
    iDisplayStart: start,
    iDisplayLength: length,
    sSearch: '',
    bRegex: false,
    iSortingCols: 0,
  }
  for (let i = 0; i < N_COLS; i++) {
    form[`mDataProp_${i}`] = i
    form[`bSearchable_${i}`] = true
    form[`sSearch_${i}`] = ''
    form[`bRegex_${i}`] = false
    form[`bSortable_${i}`] = true
  }
  return form
}

/** Turn a raw row array into a labelled listing card. */
export function rowToCard(row) {
  const get = (i) => (row[i] == null ? null : String(row[i]))
  return {
    id: get(COL.id),
    productId: get(COL.productId),
    bank: get(COL.bank),
    description: get(COL.description),
    city: get(COL.city),
    bidLastDate: get(COL.bidLastDate),
    reservePrice: get(COL.reservePrice),
    emd: get(COL.emd),
    eventType: get(COL.eventType),
    drtName: get(COL.drtName),
    category: get(COL.category),
    subType: get(COL.subType),
    logo: get(COL.logo),
  }
}

/**
 * Build the human/detail URL for a listing, mirroring the site's `checklocation`
 * JS: "/{category}-{subType}-{city}-{productID}" (lowercased, spaces -> hyphens,
 * parentheses stripped from the city).
 */
export function detailPath(card) {
  const slug = (s) => String(s || '').replace(/ /g, '-').toLowerCase()
  const citySlug = String(card.city || '').replace(/ /g, '-').replace(/\(|\)/g, '').toLowerCase()
  return `/${slug(card.category)}-${slug(card.subType)}-${citySlug}-${card.productId}`
}

/**
 * Paginate the entire live-auction catalog, invoking onPage(cards, meta) for
 * each page. The server caps page size at 10 rows, so we always request 10 and
 * walk the offset up to the reported total (or maxRecords).
 */
export async function crawlListing(client, { maxRecords = 0 } = {}, onPage) {
  const pageSize = config.bankeauctions.pageSize || 10
  let start = 0
  let total = Infinity
  let echo = 1
  let page = 0

  while (start < total && (maxRecords === 0 || start < maxRecords)) {
    const data = await client.postForm(LISTING_PATH, buildAoData({ start, length: pageSize, echo }))
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    const rows = Array.isArray(parsed?.aaData) ? parsed.aaData : []
    const reported = Number(parsed?.iTotalRecords) || 0
    if (reported) total = maxRecords ? Math.min(reported, maxRecords) : reported
    if (rows.length === 0) break

    const cards = rows.map(rowToCard).filter((c) => c.id)
    await onPage(cards, { page, start, totalCount: total })

    start += rows.length
    echo += 1
    page += 1
  }
  logger.info(`bankeauctions listing crawl complete: ~${start} rows across ${page} page(s)`)
}
