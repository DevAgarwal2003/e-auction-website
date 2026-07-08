// In-browser TTL cache for API GET responses.
// Makes pagination and revisits instant while data is fresh.

const store = new Map()

const buildKey = (path, params) => {
  if (!params) return path
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  }
  const q = qs.toString()
  return q ? `${path}?${q}` : path
}

export function peekCache(path, params) {
  const entry = store.get(buildKey(path, params))
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(buildKey(path, params))
    return null
  }
  return entry.data
}

export function setCache(path, params, data, ttlMs) {
  store.set(buildKey(path, params), { data, expiresAt: Date.now() + ttlMs })
}

export function clearCache() {
  store.clear()
}
