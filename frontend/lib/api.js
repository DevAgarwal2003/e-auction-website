// Thin client for the e-auction backend REST API (with in-browser TTL cache).
import { peekCache, setCache } from './cache.js'

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '')

const TTL = {
  list: 60_000,
  detail: 120_000,
  meta: 300_000,
}

async function getJSON(path, params, { ttlMs = 0, bypassCache = false, signal } = {}) {
  if (!bypassCache && ttlMs > 0) {
    const hit = peekCache(path, params)
    if (hit) return hit
  }

  const url = new URL(BASE + path)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    }
  }
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal })
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`)
  const data = await res.json()
  if (ttlMs > 0) setCache(path, params, data, ttlMs)
  return data
}

export const api = {
  baseUrl: BASE,
  peekList: (params) => peekCache('/api/properties', params),
  peekDetail: (id) => peekCache(`/api/properties/${encodeURIComponent(id)}`, null),
  listProperties: (params, opts) =>
    getJSON('/api/properties', params, { ttlMs: TTL.list, bypassCache: opts?.bypassCache, signal: opts?.signal }),
  getProperty: (id, opts) =>
    getJSON(`/api/properties/${encodeURIComponent(id)}`, null, {
      ttlMs: TTL.detail,
      bypassCache: opts?.bypassCache,
      signal: opts?.signal,
    }),
  filterMeta: (opts) =>
    getJSON('/api/meta/filters', null, { ttlMs: TTL.meta, bypassCache: opts?.bypassCache }),
  stats: (opts) => getJSON('/api/meta/stats', null, { ttlMs: TTL.meta, bypassCache: opts?.bypassCache }),
  health: () => getJSON('/health'),
}

export default api
