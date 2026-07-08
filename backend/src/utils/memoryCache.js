// Tiny in-memory TTL cache for read-heavy API responses.
const store = new Map()

export function cacheGet(key) {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.value
}

export function cacheSet(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function cacheClear() {
  store.clear()
}
