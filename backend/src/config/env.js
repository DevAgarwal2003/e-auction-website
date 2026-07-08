import dotenv from 'dotenv'

dotenv.config()

const bool = (v, fallback = false) => {
  if (v === undefined || v === null || v === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase())
}

const int = (v, fallback) => {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : fallback
}

const list = (v, fallback = []) =>
  v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : fallback

export const config = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://eauction:eauction@localhost:5432/eauction',

  api: {
    port: int(process.env.PORT, 4000),
    corsOrigins: list(process.env.CORS_ORIGINS, ['http://localhost:5173', 'http://127.0.0.1:5173']),
    // In-memory response cache TTLs (ms). Set to 0 to disable.
    cacheTtlListMs: int(process.env.API_CACHE_TTL_LIST_MS, 60_000),
    cacheTtlDetailMs: int(process.env.API_CACHE_TTL_DETAIL_MS, 120_000),
    cacheTtlMetaMs: int(process.env.API_CACHE_TTL_META_MS, 300_000),
  },

  // BAANKNET (Bank Asset Auction Network) JSON API ingestion settings.
  // baanknet.com is an Angular SPA backed by a public JSON REST API; we call
  // the same guest endpoints its frontend uses instead of scraping HTML.
  baanknet: {
    // Site origin + Angular contextPath + before-login API context path.
    // Effective API base: <origin><contextPath><apiContextPath>
    origin: (process.env.BAANKNET_ORIGIN || 'https://baanknet.com').replace(/\/+$/, ''),
    contextPath: process.env.BAANKNET_CONTEXT_PATH || '/eauction-psb',
    apiContextPath: process.env.BAANKNET_API_CONTEXT_PATH || '/api',
    langId: int(process.env.BAANKNET_LANG_ID, 1), // 1 = English, 2 = Hindi
    imageBaseUrl: (process.env.BAANKNET_IMAGE_BASE_URL || 'https://d14q55p4nerl4m.cloudfront.net').replace(/\/+$/, ''),
    // Disable TLS certificate verification. Useful on machines behind a
    // TLS-intercepting proxy/AV where Node's CA bundle rejects the chain.
    // Prefer running Node with `--use-system-ca` instead; this is a fallback.
    insecureTls: bool(process.env.BAANKNET_INSECURE_TLS, false),
    userAgent:
      process.env.SCRAPER_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    concurrency: int(process.env.SCRAPER_CONCURRENCY, 4),
    delayMs: int(process.env.SCRAPER_DELAY_MS, 300),
    requestTimeoutMs: int(process.env.SCRAPER_REQUEST_TIMEOUT_MS, 30000),
    maxRetries: int(process.env.SCRAPER_MAX_RETRIES, 3),
    pageSize: int(process.env.BAANKNET_PAGE_SIZE, 24),
    // Property type ids to ingest (baanknet: 1 Residential, 2 Commercial,
    // 3 Agricultural, 4 Industrial, 5 Other). Empty -> all of the above.
    propertyTypes: list(process.env.BAANKNET_PROPERTY_TYPES, ['1', '2', '3', '4', '5']).map(Number),
    // Max listing pages per property type (0 = until exhausted).
    maxPagesPerType: int(process.env.BAANKNET_MAX_PAGES_PER_TYPE, 3),
    fetchDetails: bool(process.env.BAANKNET_FETCH_DETAILS, true),
    // Resume mode: skip listings whose source_id is already stored, avoiding
    // the (expensive) detail fetch for properties we already have.
    skipExisting: bool(process.env.BAANKNET_SKIP_EXISTING, false),
    // Price-band sharding bypasses BAANKNET's ~10k listing cap per query.
    // auto = shard only types whose national total is at/above the cap (recommended)
    // on   = always build adaptive price shards
    // off  = single national query per type (legacy; Residential stops at ~10k)
    priceShard: process.env.BAANKNET_PRICE_SHARD || 'auto',
    listingCap: int(process.env.BAANKNET_LISTING_CAP, 10_000),
  },

  // bankeauctions.com (C1 India). Server-rendered site: listings come from a
  // DataTables JSON endpoint and details from server-rendered HTML pages, so
  // this source uses axios + cheerio (no headless browser needed).
  bankeauctions: {
    origin: (process.env.BANKEAUCTIONS_ORIGIN || 'https://www.bankeauctions.com').replace(/\/+$/, ''),
    // Server caps the DataTables page size at 10 rows regardless of request.
    pageSize: int(process.env.BANKEAUCTIONS_PAGE_SIZE, 10),
    // Max listing rows to ingest (0 = the whole catalog).
    maxRecords: int(process.env.BANKEAUCTIONS_MAX_RECORDS, 0),
    fetchDetails: bool(process.env.BANKEAUCTIONS_FETCH_DETAILS, true),
    skipExisting: bool(process.env.BANKEAUCTIONS_SKIP_EXISTING, false),
    userAgent:
      process.env.SCRAPER_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    concurrency: int(process.env.BANKEAUCTIONS_CONCURRENCY, int(process.env.SCRAPER_CONCURRENCY, 3)),
    delayMs: int(process.env.SCRAPER_DELAY_MS, 300),
    requestTimeoutMs: int(process.env.SCRAPER_REQUEST_TIMEOUT_MS, 30000),
    maxRetries: int(process.env.SCRAPER_MAX_RETRIES, 3),
    insecureTls: bool(process.env.BANKEAUCTIONS_INSECURE_TLS, false),
  },

  // Which sources the multi-source runner (`scrape:all` / scheduler) executes.
  sources: {
    baanknet: { enabled: bool(process.env.SOURCE_BAANKNET_ENABLED, true) },
    bankeauctions: { enabled: bool(process.env.SOURCE_BANKEAUCTIONS_ENABLED, true) },
  },

  // Object storage for downloaded sale-notice PDFs. When unconfigured, the
  // download endpoint transparently proxies the original source URL instead,
  // so the feature still works before you provision a bucket.
  storage: {
    // Any S3-compatible provider works; Cloudflare R2 is the cheap default.
    endpoint: process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : ''),
    region: process.env.R2_REGION || 'auto',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET || '',
    // Public base URL for the bucket (optional; only used for direct links).
    publicBaseUrl: (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, ''),
    get enabled() {
      return Boolean(this.endpoint && this.accessKeyId && this.secretAccessKey && this.bucket)
    },
    // Mirror property images to the bucket too (default: hotlink source URLs).
    mirrorImages: bool(process.env.MIRROR_IMAGES, false),
  },

  // Weekly refresh schedule for the built-in scheduler (node-cron syntax).
  cron: {
    schedule: process.env.CRON_SCHEDULE || '0 3 * * 0', // Sundays 03:00
    timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata',
    runOnStart: bool(process.env.CRON_RUN_ON_START, false),
  },

  get apiBaseUrl() {
    const b = this.baanknet
    return `${b.origin}${b.contextPath}${b.apiContextPath}`
  },
}

export default config
