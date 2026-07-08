# E-Auction Backend

Ingests bank e-auction listings from multiple portals, de-duplicates them,
stores them in **PostgreSQL** (Neon in production), and serves a REST API that
the React frontend consumes.

```
sources ──fetch──▶ normalize ──dedup──▶ PostgreSQL ──REST API──▶ frontend
                                  │
                                  ├─▶ sale-notice PDFs ──▶ object storage (Cloudflare R2)
                                  └─▶ auction_rounds (history timeline)
```

## Sources (multi-source)

Each source is a self-contained adapter under `src/sources/<name>/` exposing
`{ source, label, enabled, run(options) }`, registered in
[`src/sources/registry.js`](src/sources/registry.js). Add a new bank portal by
dropping a folder and registering it — the multi-source runner and scheduler
pick it up automatically.

| Source | Site | Method |
| --- | --- | --- |
| `baanknet` | [baanknet.com](https://baanknet.com) | JSON API (guest endpoints) |
| `bankeauctions` | [bankeauctions.com](https://www.bankeauctions.com) (C1 India) | DataTables JSON listing + server-rendered detail HTML (cheerio) |

Run one, several, or all sources:

```bash
npm run scrape                 # baanknet only (legacy entrypoint)
npm run scrape:bankeauctions   # bankeauctions only
npm run scrape:all             # every enabled source, sequentially
npm run scrape:all baanknet    # a named subset
```

`baanknet` is an Angular single-page app backed by a JSON REST API; we call the
same public (guest) endpoints its own frontend uses instead of scraping HTML:

baanknet is an Angular single-page app backed by a JSON REST API; we call the
same public (guest) endpoints its own frontend uses instead of scraping HTML:

- `POST /property-listing-data/{propertyTypeId}?page=&size=` — paginated list of
  the **entire** property catalog (every listed property, not just biddable
  auctions). Each card carries the numeric `propertyId` = `propertyDetailId`
  plus rich fields (area, coordinates, bank, address, photo, auction window).
  The request body must include `searchType: ''` (otherwise the server 400/500s).
- `GET  /view-property-detail/{id}/{langId}` — complete property detail
  (borrower, EMD, full auction schedule).
- `GET  /get-property-media/{id}` — full property image/video gallery.

## Tech stack

- **Node.js (ESM)** — no build step
- **Express** — REST API
- **PostgreSQL** (`pg`) with `pg_trgm` for fuzzy keyword search & dedup
- **axios** — JSON API client (cookie jar, throttle, retries)
- **p-limit** — bounded request concurrency

## Project structure

```
backend/
├── docker-compose.yml          # one-command local Postgres
├── .env.example
└── src/
    ├── config/env.js           # env-driven config
    ├── db/
    │   ├── schema.sql          # tables, indexes, extensions (dedup-aware)
    │   ├── pool.js             # pg connection pool
    │   └── migrate.js          # applies schema.sql
    ├── baanknet/               # baanknet JSON API client / endpoints / normalize
    ├── scrape/httpClient.js    # generic axios client: cookie jar + retries + throttle
    ├── sources/                # pluggable source adapters
    │   ├── registry.js         # list of adapters (add new portals here)
    │   ├── baanknet/index.js   # wraps services/ingestService.js
    │   └── bankeauctions/      # client / listing / detail / normalize / ingest
    ├── storage/r2.js           # S3-compatible object storage (lazy; optional)
    ├── utils/                  # format / indianStates helpers
    ├── dedup/fingerprint.js    # content hash + identity fingerprint
    ├── repositories/
    │   ├── propertyRepository.js  # upsert / dedup / run audit
    │   ├── documentRepository.js  # property_documents + auction_rounds
    │   └── propertyQueries.js     # filtered search / detail / meta / stats
    ├── services/
    │   ├── ingestService.js    # baanknet ingestion run
    │   ├── documentService.js  # download + mirror sale-notice PDFs
    │   └── roundService.js     # record auction-history rounds
    ├── jobs/
    │   ├── runScrape.js        # `npm run scrape` (baanknet)
    │   ├── runAllSources.js    # `npm run scrape:all` (multi-source)
    │   ├── scheduler.js        # `npm run schedule` (weekly node-cron)
    │   └── testScrape.js       # `npm run scrape:detail-test` (no DB needed)
    └── api/
        ├── server.js
        └── routes/{properties,meta}.js
```

## Quick start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Start PostgreSQL

With Docker (recommended):

```bash
docker compose up -d
```

This launches Postgres 16 on `localhost:5432` with db/user/pass all `eauction`,
matching the default `DATABASE_URL`.

> No Docker? Install PostgreSQL locally, create a database, and set `DATABASE_URL`
> in `.env` accordingly.

### 3. Configure environment

```bash
cp .env.example .env
```

Adjust if needed. The baanknet API is read as a guest — no credentials required.

> **TLS note:** the ingest scripts run Node with `--use-system-ca` so they work
> on machines behind a TLS-intercepting proxy/AV. If you still hit certificate
> errors, set `BAANKNET_INSECURE_TLS=true` in `.env` as a last resort.

### 4. Create the schema

```bash
npm run migrate
```

### 5. Fetch & ingest

```bash
npm run scrape
```

Controlled by `BAANKNET_*` env vars:

| Variable | Default | Meaning |
| --- | --- | --- |
| `BAANKNET_PROPERTY_TYPES` | `1,2,3,4,5` | type ids: 1 Residential, 2 Commercial, 3 Agricultural, 4 Industrial, 5 Other |
| `BAANKNET_MAX_PAGES_PER_TYPE` | `3` | `0` = every page (the whole catalog) |
| `BAANKNET_PAGE_SIZE` | `24` | listing page size |
| `BAANKNET_FETCH_DETAILS` | `true` | also fetch each property's full detail + images |
| `BAANKNET_SKIP_EXISTING` | `false` | resume mode: skip already-stored properties |
| `BAANKNET_PRICE_SHARD` | `auto` | `auto` / `on` / `off` — split listing queries by price band when the API's ~10k cap is hit |
| `BAANKNET_LISTING_CAP` | `10000` | reported total at/above which a query is considered capped |
| `SCRAPER_CONCURRENCY` | `4` | parallel detail fetches |
| `SCRAPER_DELAY_MS` | `300` | politeness delay between requests |

> **Ingesting everything:** baanknet lists ~89k properties (~51k Residential alone).
> The listing API caps each query at ~10k results, so a plain national crawl only
> gets the first ~10k Residential rows. Set `BAANKNET_PRICE_SHARD=auto` (default)
> to automatically split capped types into price bands. To resume after a partial
> run without re-fetching detail pages you already have:
>
> ```bash
> npm run scrape:remaining
> ```
>
> (`BAANKNET_SKIP_EXISTING=true`, `BAANKNET_PRICE_SHARD=auto`, full pagination).
> Be patient and polite — raise `SCRAPER_DELAY_MS` if you see throttling.
> Re-running is safe: existing listings are **updated**, not duplicated.

### bankeauctions.com source

```bash
npm run scrape:bankeauctions
```

| Variable | Default | Meaning |
| --- | --- | --- |
| `BANKEAUCTIONS_MAX_RECORDS` | `0` | max listing rows per run (`0` = the whole live catalog) |
| `BANKEAUCTIONS_FETCH_DETAILS` | `true` | fetch each property's detail page (dates, EMD, sale-notice PDF) |
| `BANKEAUCTIONS_SKIP_EXISTING` | `false` | resume mode: skip already-stored listings |
| `BANKEAUCTIONS_CONCURRENCY` | `3` | parallel detail fetches |

The listing endpoint (`/home/liveAuctionDatatable/`) caps page size at 10 rows,
so ingestion walks the offset across the reported total. Detail pages are parsed
with cheerio; sale-notice / tender documents are captured (see below). Area is
not exposed as a structured field, so it stays null (the free-text description
carries it).

## Sale-notice documents & object storage

Documents attached to a listing (sale notices, tender docs) are recorded in the
`property_documents` table and served through the API so users download them
from **your** domain:

```
GET /api/properties/:id/sale-notice   # streams the PDF/zip as an attachment
```

- If **object storage is configured** (`R2_*` in `.env`), the bytes are
  downloaded during ingest and mirrored to Cloudflare R2 (or any S3-compatible
  bucket), so the file survives even after the bank removes the original.
- If **not configured**, the endpoint transparently proxies the original bank
  URL (adding the same-origin `Referer` some portals require). The feature works
  either way — configure R2 later for durability without code changes.

Neon (Postgres) stays small: only document metadata + the storage key / source
URL live in the database, never the file bytes.

## Auction history

Each ingested auction is recorded as a row in `auction_rounds`, grouped by the
property `fingerprint`. When the same physical property is re-listed (a new
`source_id`, possibly on a different portal), the rounds accumulate into one
timeline. `GET /api/properties/:id` returns the prior rounds as `auctionHistory`,
which the detail page renders inside the property — so history is only visible
when you open a property.

## Scheduling (weekly refresh)

Keep the DB fresh with either approach:

- **Built-in scheduler** (long-running process):

  ```bash
  npm run schedule   # node-cron; CRON_SCHEDULE (default: Sundays 03:00 IST)
  ```

  Keep it alive with pm2 / a systemd unit / a container. `CRON_RUN_ON_START=true`
  triggers one run immediately on boot.

- **External scheduler** (Windows Task Scheduler / a cloud cron) calling
  `npm run scrape:all` on your cadence.

Each run also flips listings that disappeared from a source to
`is_active = false`.

### 6. Run the API

```bash
npm start          # http://localhost:4000
# or: npm run dev  (auto-restart)
```

## Try the fetcher without a database

```bash
npm run scrape:detail-test           # property type 1 (Residential)
npm run scrape:detail-test 2         # property type 2 (Commercial)
```

Lists one auction page + fetches the first property's full detail and images,
normalizes it, and prints the result. Useful for verifying the API contract and
field mapping still hold.

## REST API

| Method & path | Description |
| --- | --- |
| `GET /health` | DB connectivity check |
| `GET /api/properties` | Filtered, paginated, sorted listings |
| `GET /api/properties/:id` | Single property (`source_id` or db id) + similar + `auctionHistory` + `saleNoticeUrl` |
| `GET /api/properties/:id/sale-notice` | Download the sale-notice document (stored copy or proxied) |
| `GET /api/meta/filters` | Distinct states / cities / localities / types / banks |
| `GET /api/meta/stats` | Headline counts for the homepage |

`GET /api/properties` query params (all optional):
`state, city, locality, type, budget (0-5 index), bank, status, keyword,
sort (relevance|price-asc|price-desc|date|newest), page, limit`.

Response shape:

```json
{ "total": 1234, "page": 1, "limit": 12, "pageCount": 103, "results": [ /* camelCase properties */ ] }
```

The `results` objects already match the shape the React frontend expects
(`id, title, propertyType, bank, state, city, locality, reservePrice, emd, area,
areaUnit, auctionDate, status, possession, images[], ...`).

## How de-duplication works

1. **Same listing re-scraped** → the `(source, source_id)` unique constraint
   makes every write an **upsert**. `content_hash` means unchanged rows don't
   churn `updated_at`; `last_seen` is always refreshed.
2. **Same property under different IDs** → each row gets a normalized
   `fingerprint` (bank + city + locality + pincode + reserve price + area +
   auction date). `markDuplicates()` keeps the lowest id per fingerprint as the
   canonical record and points the rest at it via `duplicate_of`. Public queries
   only return rows where `duplicate_of IS NULL AND is_active = TRUE`.

## Notes & caveats

- baanknet.com is the source of truth; respect their terms and don't hammer it.
  Keep `SCRAPER_DELAY_MS` reasonable and `SCRAPER_CONCURRENCY` modest.
- This consumes baanknet's unofficial/public JSON API (the same endpoints its
  own frontend uses). If the API contract changes, update `src/baanknet/api.js`
  and `src/baanknet/normalize.js`.
- `property-listing-data` returns the **full catalog** — every listed property,
  whether or not it currently has an auction. Properties with an active auction
  get a `Live`/`Upcoming`/`Closed` status from their auction window; properties
  with no auction window default to `Upcoming` (listed, auction TBD).
- A full run is large (tens of thousands of properties × detail + media calls).
  Use `BAANKNET_MAX_PAGES_PER_TYPE` to bound it, `BAANKNET_SKIP_EXISTING=true` to
  resume, or `BAANKNET_FETCH_DETAILS=false` for a fast listing-only pass (the
  listing cards alone are already quite rich).
