/**
 * Resume ingest: price-sharded crawl + skip properties already in the DB.
 * Use after an initial national scrape that hit the ~10k Residential cap.
 *
 *   npm run scrape:remaining
 */
process.env.BAANKNET_SKIP_EXISTING ??= 'true'
process.env.BAANKNET_PRICE_SHARD ??= 'auto'
process.env.BAANKNET_MAX_PAGES_PER_TYPE ??= '0'

await import('./runScrape.js')
