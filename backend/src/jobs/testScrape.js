import { BaanknetClient } from '../baanknet/client.js'
import { fetchListingPage, fetchPropertyDetail, fetchPropertyImages, PROPERTY_TYPES } from '../baanknet/api.js'
import { normalizeProperty } from '../baanknet/normalize.js'
import { logger } from '../utils/logger.js'

// DB-free smoke test: list one catalog page for a property type, fetch the
// first property's full detail + images, normalize it, and print the result.
// Useful to verify the baanknet API contract / mapping still hold.
async function main() {
  const client = new BaanknetClient()
  const propertyTypeId = Number(process.argv[2]) || 1

  logger.info(`Fetching catalog page for propertyType=${propertyTypeId} (${PROPERTY_TYPES[propertyTypeId] || '?'})...`)
  const { items, totalCount } = await fetchListingPage(client, { propertyTypeId, page: 0, pageSize: 3 })
  logger.info(`Reported total: ${totalCount}, properties on page: ${items.length}`)

  if (items.length === 0) {
    logger.warn('No properties returned — the API contract may have changed.')
    return
  }

  console.log('\n--- First 3 listing cards ---')
  console.log(JSON.stringify(items.slice(0, 3), null, 2))

  const first = items[0]
  logger.info(`\nFetching detail for property id=${first.propertyId}`)
  const detail = await fetchPropertyDetail(client, first.propertyId)
  const images = await fetchPropertyImages(client, first.propertyId)
  const normalized = normalizeProperty({ detail, card: first, images, propertyTypeId })
  console.log('\n--- Normalized property ---')
  console.log(JSON.stringify(normalized, null, 2))
}

main().catch((err) => {
  logger.error('Test fetch failed:', err.stack || err.message)
  process.exitCode = 1
})
