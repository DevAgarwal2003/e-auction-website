import { config } from '../../config/env.js'
import { cleanText, parseNumber, parseDateTime, toDateOnly } from '../../utils/format.js'
import { contentHash, fingerprint } from '../../dedup/fingerprint.js'
import { resolveState } from '../../utils/indianStates.js'
import { detailPath } from './listing.js'

// bankeauctions formats money with decimals ("17,63,000.00" / "1795200.00"),
// so parse as a decimal and round to whole rupees. (parseInr would drop the
// decimal point and inflate the value 100x.)
const money = (v) => {
  const n = parseNumber(v)
  return n == null ? null : Math.round(n)
}

// Map bankeauctions property sub-categories to our top-level property types.
const RESIDENTIAL = /resid|flat|apartment|house|bungalow|villa|plot|row house|penthouse|tenament|farm house/i
const COMMERCIAL = /commerc|shop|office|showroom|godown|hall|hotel|petrol|premises|warehouse|club/i
const INDUSTRIAL = /indust|factory|plant|machinery|shed|warehouse/i
const AGRICULTURAL = /agri|farm land|poultry|land\b/i

function toPropertyType(subType, category) {
  const s = `${subType || ''}`
  if (RESIDENTIAL.test(s)) return 'Residential'
  if (INDUSTRIAL.test(s)) return 'Industrial'
  if (COMMERCIAL.test(s)) return 'Commercial'
  if (AGRICULTURAL.test(s)) return 'Agricultural'
  // Movable assets (vehicles, gold, machinery-only) fall through to Other.
  return 'Other'
}

// bankeauctions "07 Mar 2026" (date) and "06 Jul 2026 11:00" (datetime).
const parseBeDate = (v) => parseDateTime(v)

function deriveStatus(start, end) {
  const now = new Date()
  if (start && now < start) return 'Upcoming'
  if (end && now > end) return 'Closed'
  if (start && end) return 'Live'
  if (start) return 'Upcoming'
  return 'Upcoming'
}

/**
 * Convert a bankeauctions listing card (+ optional parsed detail) into the
 * canonical property record shared with the repository and frontend.
 */
export function normalizeProperty({ card, detail = null }) {
  const f = detail?.fields || {}
  const sourceId = String(card.id || '').trim()

  const subType = cleanText(f['Property Sub Category'] || card.subType || '') || null
  const category = cleanText(f['Property Category'] || card.category || '') || null
  const propertyType = toPropertyType(subType, category)

  const bank = cleanText(f['Event Bank/Organisation Name'] || card.bank || '') || null
  const branch = cleanText(f['Event Branch'] || '') || null
  const borrowerName = cleanText(f["Borrower's Name"] || '') || null

  const city = cleanText(card.city || '') || null
  const state = resolveState(null, city)

  const description = cleanText(f['Property Description'] || card.description || '') || null

  const reservePrice = money(f['Reserve Price']) ?? money(card.reservePrice)
  const emd = money(f['EMD Amount']) ?? money(card.emd)
  const bidIncrement = money(f['Bid Increment value'])

  const auctionStart = parseBeDate(f['Auction Start Date and Time'])
  const auctionEnd = parseBeDate(f['Auction End Date and Time'])
  const emdSubmission = parseBeDate(
    f['Offer (First Round Quote) Submission Last Date'] || card.bidLastDate,
  )
  const status = deriveStatus(auctionStart, auctionEnd)

  const titleParts = [subType || category || 'Property']
  if (city) titleParts.push(`in ${city}`)
  const title = cleanText(titleParts.join(' ')) || 'Auction property'

  const sourceUrl = `${config.bankeauctions.origin}${detail?.sourcePath || detailPath(card)}`

  // Documents parsed from the detail page (sale notice / tender / annexures).
  const documents = (detail?.documents || []).filter((d) => d.url)

  const property = {
    source: 'bankeauctions',
    sourceId,
    sourceUrl,
    title,
    propertyType,
    subType,
    categorySlug: category,
    bank,
    borrowerName,
    branch,
    state,
    city,
    locality: null,
    address: description, // bankeauctions puts the full legal address in the description
    pincode: null,
    reservePrice: reservePrice ?? null,
    emd: emd ?? null,
    bidIncrement: bidIncrement ?? null,
    area: null, // area is only present as free text inside the description
    areaUnit: null,
    areaText: null,
    auctionDate: toDateOnly(auctionStart),
    auctionStart: auctionStart ? auctionStart.toISOString() : null,
    auctionEnd: auctionEnd ? auctionEnd.toISOString() : null,
    emdSubmission: emdSubmission ? emdSubmission.toISOString() : null,
    status,
    possession: null,
    images: [], // bankeauctions listings rarely expose property photos (only bank logos)
    description,
    priceDropLabel: null,
    previousReservePrice: null,
    auctionHistory: [],
    documents,
    raw: {
      card,
      productId: card.productId,
      eventType: cleanText(f['Event Type'] || card.eventType || '') || null,
      eventNo: cleanText(f['Event No.'] || '') || null,
      nitRef: cleanText(f['NIT Ref. No.'] || '') || null,
      emdBankName: cleanText(f['EMD Deposit Bank Name'] || '') || null,
      emdAccount: cleanText(f['EMD Deposit Bank Account Number'] || '') || null,
      emdIfsc: cleanText(f['EMD Deposit Bank IFSC Code'] || '') || null,
      pressReleaseDate: cleanText(f['Press Release Date'] || '') || null,
      documents,
    },
  }

  property.contentHash = contentHash(property)
  property.fingerprint = fingerprint(property)
  return property
}

export default normalizeProperty
