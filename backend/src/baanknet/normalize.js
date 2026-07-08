import { config } from '../config/env.js'
import { cleanText, parseDateTime, toDateOnly } from '../utils/format.js'
import { contentHash, fingerprint } from '../dedup/fingerprint.js'
import { resolveState } from '../utils/indianStates.js'
import { PROPERTY_TYPES } from './api.js'

const num = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : null
}

const float = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// Pick the property-type-specific detail sub-object (only one is non-null).
function pickTypeDetail(d) {
  return (
    d.residentialDetail ||
    d.commercialDetail ||
    d.agricultureDetail ||
    d.industryDetail ||
    d.otherDetail ||
    null
  )
}

// Best-effort area extraction across the various per-type detail shapes.
function extractArea(typeDetail) {
  if (!typeDetail) return { area: null, unit: null }
  const candidates = [
    ['carpetAreaSqft', 'sq feet'],
    ['builtupAreaSqft', 'sq feet'],
    ['superBuiltupAreaSqft', 'sq feet'],
    ['plotAreaSqft', 'sq feet'],
    ['landAreaSqft', 'sq feet'],
    ['totalAreaSqft', 'sq feet'],
    ['areaSqft', 'sq feet'],
    ['area', null],
  ]
  for (const [key, unit] of candidates) {
    const v = float(typeDetail[key])
    if (v) return { area: v, unit }
  }
  return { area: null, unit: null }
}

// Derive Live / Upcoming / Closed from the auction window.
function deriveStatus(start, end) {
  const now = new Date()
  if (start && now < start) return 'Upcoming'
  if (end && now > end) return 'Closed'
  if (start && end) return 'Live'
  if (start) return 'Upcoming'
  return 'Upcoming'
}

// Turn a relative CloudFront media path into an absolute URL.
function imageUrl(path) {
  if (!path) return null
  return `${config.baanknet.imageBaseUrl}/${String(path).replace(/^\/+/, '')}`
}

/**
 * Convert a baanknet property into the canonical record stored in PostgreSQL.
 *
 * The `property-listing-data` card is already rich (area, coordinates, bank,
 * address, photo) so it is the base. When the full `view-property-detail`
 * payload (+ media gallery) is available it enriches/overrides the card with
 * borrower, EMD, auction schedule and the complete image set. Either source may
 * be absent — a card-only record is still produced so the full catalog can be
 * ingested even when a detail fetch fails or is disabled.
 *
 * The output shape matches what the source-agnostic repository/upsert and
 * frontend API mapper expect.
 */
export function normalizeProperty({ detail = null, card = {}, images = [], propertyTypeId } = {}) {
  const common = detail?.commonPropertyDetails || {}
  const auction = detail?.auctionDetails || {}
  const typeDetail = detail ? pickTypeDetail(detail) : null

  const sourceId = String(
    card.propertyId || common.propertyDetailId || detail?.propertyDetailId || '',
  ).trim()

  const masterType = detail?.masterPropertyType || propertyTypeId
  const propertyType = PROPERTY_TYPES[masterType] || 'Other'
  const subType =
    cleanText(card.propertySubType || common.propertySubType?.propertySubType || detail?.propertyType || '') ||
    null

  const bank =
    cleanText(card.bankName || detail?.bankName || common.department?.bank?.bankName || '') || null
  const branch = cleanText(common.department?.departmentName || card.roname || '') || null
  const borrowerName = cleanText(common.borrowerName || common.ownerName || '') || null

  const city = cleanText(card.city || detail?.city || common.city?.city || '') || null
  const rawState = cleanText(card.statename || common.stateId?.stateName || '') || null
  const state = resolveState(rawState, city)
  const district = cleanText(card.districtname || common.districtId?.districtname || '') || null
  const locality = cleanText(card.localities || detail?.locality || common.locality || '') || null
  const address = cleanText(common.address || card.address || common.borrowerAddress || '') || null
  const pincode = cleanText(card.pincode || common.pincode || '') || null

  const reservePrice = num(auction.ReservePrice ?? card.price ?? detail?.propertyPrice ?? common.propertyPrice)
  const emd = num(auction.EMD)
  const bidIncrement = num(auction.bidIncrementAmount ?? auction.IncrementAmount)

  // Area: prefer the listing card (it pairs the value with an explicit, correct
  // unit) and fall back to the detail's per-type figure (always labelled sqft).
  let area = float(card.carpetArea) || float(card.builtupArea)
  let unit = area ? cleanText(card.unitOfMeasure) || 'sq feet' : null
  if (!area) {
    const fromDetail = extractArea(typeDetail)
    area = fromDetail.area
    unit = fromDetail.unit
  }

  const auctionStart = parseDateTime(auction.Auctionstartdate || card.auctionStartDateTime)
  const auctionEnd = parseDateTime(auction.AuctionEndDate || card.auctionEndDateTime)
  const emdSubmission = parseDateTime(auction.paymentEndDate || card.emdEndDateTime)
  const hasAuction =
    card.isAuctioncreated === true || auction.isAuctionAvailable === 1 || Boolean(auctionStart)
  const status = deriveStatus(auctionStart, auctionEnd)

  const possession =
    cleanText(card.possessionType || common.propertyPossessionTypeId?.propertyPossessionType || '') || null

  const description = cleanText(card.summaryDesc || detail?.summaryDesc || common.summaryDesc || '') || null

  const title =
    `${subType || propertyType}${city ? ` in ${city}` : ''}`.trim() || 'Auction property'

  const sourceUrl = `${config.baanknet.origin}/view-property/${sourceId}`

  // Images: prefer the fetched gallery, else the listing card's main photo.
  let imgs = Array.isArray(images) ? images.filter(Boolean) : []
  if (imgs.length === 0 && card.photos) {
    const main = imageUrl(card.photos)
    if (main) imgs = [main]
  }

  const coordinate =
    card.coordinate ||
    (detail && (detail.lat || detail.lng) ? { lat: float(detail.lat), lon: float(detail.lng) } : null)

  const property = {
    source: 'baanknet',
    sourceId,
    sourceUrl,
    title,
    propertyType,
    subType,
    categorySlug: masterType ? String(masterType) : null,
    bank,
    borrowerName,
    branch,
    state,
    city,
    locality,
    address,
    pincode,
    reservePrice,
    emd,
    bidIncrement,
    area,
    areaUnit: unit,
    areaText: area ? `${area} ${unit || ''}`.trim() : null,
    auctionDate: toDateOnly(auctionStart),
    auctionStart: auctionStart ? auctionStart.toISOString() : null,
    auctionEnd: auctionEnd ? auctionEnd.toISOString() : null,
    emdSubmission: emdSubmission ? emdSubmission.toISOString() : null,
    status,
    possession,
    images: imgs,
    description,
    priceDropLabel: null,
    previousReservePrice: null,
    auctionHistory: [],
    raw: {
      card,
      hasAuction,
      district,
      coordinate,
      bankPropertyId: card.bankPropertyId || common.propertyUniqueId || detail?.bankPropertyId || null,
      // Trim the heavy nested master objects but keep the useful extras.
      detail: detail
        ? {
            auctionId: auction.AuctionId,
            propertyUniqueId: common.propertyUniqueId || detail.bankPropertyId,
            lat: float(detail.lat),
            lng: float(detail.lng),
            npaAmount: num(common.npaAmount),
            ownershipType: common.propertyOwnerShipType?.propertyOwnerShipType || card.owenershipType || null,
            titleDeedType: common.propertyTitleDeedTypeId?.propertyTitleDeedType || null,
            assetType: common.assetTypeId?.assetType || card.typeOfAsset || null,
            typeOfAction: detail.typeOfAction || card.typeOfAction || null,
            symbolicPossDate: common.symbolicPossDate || null,
            physicalPossDate: common.physicalPossDate || null,
            district: common.districtId?.districtname || null,
            imgCount: detail.imgCount ?? card.availablePhotosCount ?? null,
            visitCount: detail.visitOrCount ?? null,
            paymentStartDate: auction.paymentStartDate || null,
            inspectionStart: auction.inspectionStartDateTime || card.inspectionStartDateTime || null,
            inspectionEnd: auction.inspectionEndDateTime || card.inspectionEndDateTime || null,
          }
        : null,
    },
  }

  property.contentHash = contentHash(property)
  property.fingerprint = fingerprint(property)
  return property
}
