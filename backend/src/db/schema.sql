-- ============================================================================
-- E-Auction aggregator schema
-- Source of truth for properties aggregated from bank e-auction sites (BAANKNET).
-- ============================================================================

-- Trigram extension powers fuzzy keyword search and helps cross-source dedup.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ----------------------------------------------------------------------------
-- properties: the canonical, de-duplicated listing shown on the website.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS properties (
  id              BIGSERIAL PRIMARY KEY,

  -- Source identity. (source, source_id) is the natural key used for upserts,
  -- so re-scraping the same listing updates the row instead of duplicating it.
  source          TEXT        NOT NULL DEFAULT 'baanknet',
  source_id       TEXT        NOT NULL,
  source_url      TEXT,

  -- Core descriptive fields (mapped to the frontend's property shape).
  title           TEXT        NOT NULL,
  property_type   TEXT,           -- Residential / Commercial / Industrial / Agricultural / Other
  sub_type        TEXT,
  category_slug   TEXT,           -- raw baanknet property-type id
  bank            TEXT,
  borrower_name   TEXT,
  branch          TEXT,

  -- Location
  state           TEXT,
  city            TEXT,
  locality        TEXT,
  address         TEXT,
  pincode         TEXT,

  -- Money (integer rupees)
  reserve_price   BIGINT,
  emd             BIGINT,
  bid_increment   BIGINT,

  -- Size
  area            NUMERIC,
  area_unit       TEXT,
  area_text       TEXT,

  -- Auction schedule
  auction_date    DATE,
  auction_start   TIMESTAMPTZ,
  auction_end     TIMESTAMPTZ,
  emd_submission  TIMESTAMPTZ,

  status          TEXT,           -- Live / Upcoming / Closed
  possession      TEXT,           -- Physical / Symbolic

  images          JSONB       NOT NULL DEFAULT '[]'::jsonb,
  description     TEXT,

  -- Price variation (from search card) and past auction rounds (detail tab).
  price_drop_label      TEXT,
  previous_reserve_price BIGINT,
  auction_history       JSONB       NOT NULL DEFAULT '[]'::jsonb,

  -- De-duplication & change tracking
  content_hash    TEXT,           -- hash of the meaningful fields; skip no-op updates
  fingerprint     TEXT,           -- normalized identity hash for cross-listing dedup
  duplicate_of    BIGINT          REFERENCES properties(id) ON DELETE SET NULL,

  -- Raw scraped payload for re-processing / debugging
  raw             JSONB,

  -- Lifecycle
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  first_seen      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_properties_source UNIQUE (source, source_id)
);

-- Filter indexes (mirror the frontend's filter set)
CREATE INDEX IF NOT EXISTS idx_properties_state         ON properties (state);
CREATE INDEX IF NOT EXISTS idx_properties_city          ON properties (city);
CREATE INDEX IF NOT EXISTS idx_properties_locality      ON properties (locality);
CREATE INDEX IF NOT EXISTS idx_properties_type          ON properties (property_type);
CREATE INDEX IF NOT EXISTS idx_properties_bank          ON properties (bank);
CREATE INDEX IF NOT EXISTS idx_properties_status        ON properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_reserve_price ON properties (reserve_price);
CREATE INDEX IF NOT EXISTS idx_properties_auction_date  ON properties (auction_date);
CREATE INDEX IF NOT EXISTS idx_properties_fingerprint   ON properties (fingerprint);
CREATE INDEX IF NOT EXISTS idx_properties_active        ON properties (is_active);

-- Safe upgrades when schema.sql is re-run against an existing database.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_drop_label TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS previous_reserve_price BIGINT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS auction_history JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Fuzzy keyword search across title + locality + address
CREATE INDEX IF NOT EXISTS idx_properties_title_trgm   ON properties USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_address_trgm ON properties USING gin (address gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- property_documents: files attached to a listing (sale notices, tender docs,
-- annexures, corrigenda). The bytes live in object storage (Cloudflare R2);
-- only metadata + the storage key / original URL are kept here so Neon stays
-- small. When object storage is not configured, storage_key stays NULL and the
-- download endpoint proxies source_url directly.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS property_documents (
  id            BIGSERIAL PRIMARY KEY,
  property_id   BIGINT      NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  doc_type      TEXT        NOT NULL DEFAULT 'sale_notice', -- sale_notice / tender / annexure / corrigendum / other
  label         TEXT,                                       -- human label from the source page
  source_url    TEXT,                                       -- original URL on the bank site
  storage_key   TEXT,                                       -- object-storage key (NULL until mirrored)
  file_name     TEXT,
  mime_type     TEXT,
  byte_size     BIGINT,
  content_hash  TEXT,                                       -- dedupe identical files
  status        TEXT        NOT NULL DEFAULT 'pending',     -- pending / external / stored / failed
  fetched_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_property_documents UNIQUE (property_id, doc_type, source_url)
);
CREATE INDEX IF NOT EXISTS idx_property_documents_prop ON property_documents (property_id);

-- ----------------------------------------------------------------------------
-- auction_rounds: the auction history for a physical property. Rounds are keyed
-- by `fingerprint` so that repeated listings of the same property (a new
-- source_id each time it is re-auctioned, possibly across sources) collapse
-- into one timeline. The property detail page shows every round sharing the
-- listing's fingerprint.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auction_rounds (
  id              BIGSERIAL   PRIMARY KEY,
  fingerprint     TEXT        NOT NULL,       -- canonical property identity (groups relistings)
  property_id     BIGINT      REFERENCES properties(id) ON DELETE SET NULL,
  source          TEXT        NOT NULL,
  source_id       TEXT,
  round_no        INT,
  auction_date    DATE,
  auction_start   TIMESTAMPTZ,
  reserve_price   BIGINT,
  emd             BIGINT,
  area_text       TEXT,
  possession      TEXT,
  outcome         TEXT,                        -- scheduled / sold / unsold / cancelled / unknown
  sale_notice_id  BIGINT      REFERENCES property_documents(id) ON DELETE SET NULL,
  source_url      TEXT,
  raw             JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One round per (physical property, listing, auction date).
  CONSTRAINT uq_auction_rounds UNIQUE (fingerprint, source, source_id, auction_date)
);
CREATE INDEX IF NOT EXISTS idx_auction_rounds_fp   ON auction_rounds (fingerprint);
CREATE INDEX IF NOT EXISTS idx_auction_rounds_prop ON auction_rounds (property_id);

-- ----------------------------------------------------------------------------
-- scrape_runs: lightweight audit of each ingestion run.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scrape_runs (
  id            BIGSERIAL PRIMARY KEY,
  source        TEXT        NOT NULL DEFAULT 'baanknet',
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ,
  status        TEXT        NOT NULL DEFAULT 'running',  -- running / success / failed
  pages_scraped INT         NOT NULL DEFAULT 0,
  seen          INT         NOT NULL DEFAULT 0,
  inserted      INT         NOT NULL DEFAULT 0,
  updated       INT         NOT NULL DEFAULT 0,
  duplicates    INT         NOT NULL DEFAULT 0,
  errors        INT         NOT NULL DEFAULT 0,
  message       TEXT
);
