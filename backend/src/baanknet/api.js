import { config } from '../config/env.js'

// baanknet master property-type ids -> frontend top-level property types.
export const PROPERTY_TYPES = {
  1: 'Residential',
  2: 'Commercial',
  3: 'Agricultural',
  4: 'Industrial',
  5: 'Other',
}

// Default filter for the full-catalog listing endpoint: every city, any price,
// sorted newest-first (sortBy=3). `searchType: ''` is the field that makes the
// server accept the request (omitting it yields a 400/500).
export const LISTING_FILTER = Object.freeze({
  city: '',
  searchType: '',
  priceFrom: '0',
  priceTo: '100000000000',
  sortBy: '3',
})

/**
 * Fetch one page of the FULL property catalog for a property type (every listed
 * property, not just biddable auctions). Returns { items, totalCount } where
 * each item's numeric `propertyId` is the id used by the detail/media endpoints.
 */
export async function fetchListingPage(client, { propertyTypeId, page, pageSize, filter = LISTING_FILTER }) {
  const res = await client.post(
    `/property-listing-data/${propertyTypeId}?page=${page}&size=${pageSize}`,
    filter,
  )
  const items = Array.isArray(res?.data) ? res.data : []
  const totalCount = Number(res?.totalCount) || 0
  return { items, totalCount }
}

/**
 * Paginate through the entire catalog of a property type, invoking
 * onPage(items, meta) for each page. Stops at maxPages (0 = until exhausted)
 * or when the server returns an empty page / the reported total is reached.
 */
export async function crawlListing(client, { propertyTypeId, pageSize, maxPages, filter }, onPage) {
  let page = 0
  let total = Infinity
  let fetched = 0
  while ((maxPages === 0 || page < maxPages) && fetched < total) {
    const { items, totalCount } = await fetchListingPage(client, { propertyTypeId, page, pageSize, filter })
    if (totalCount) total = totalCount
    if (items.length === 0) break
    await onPage(items, { propertyTypeId, page, totalCount: total })
    fetched += items.length
    page += 1
  }
}

/** Fetch the complete detail payload for a property (numeric propertyDetailId). */
export async function fetchPropertyDetail(client, id, langId = config.baanknet.langId) {
  const res = await client.get(`/view-property-detail/${id}/${langId}`)
  if (String(res?.status) !== '1' || !res?.respData) {
    const err = new Error(`No detail for property ${id} (status=${res?.status})`)
    err.code = 'NO_DETAIL'
    throw err
  }
  return res.respData
}

/** Fetch the image gallery for a property and return absolute CloudFront URLs. */
export async function fetchPropertyImages(client, id) {
  try {
    const res = await client.get(`/get-property-media/${id}`)
    const list = Array.isArray(res?.respData) ? res.respData : []
    return list
      .filter((m) => m?.filePath)
      .map((m) => `${config.baanknet.imageBaseUrl}/${String(m.filePath).replace(/^\/+/, '')}`)
  } catch {
    return []
  }
}
