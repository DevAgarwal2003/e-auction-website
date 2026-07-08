import { cacheGet, cacheSet } from '../../utils/memoryCache.js'

/**
 * Caches successful JSON GET responses in memory for `ttlMs`.
 * Adds X-Cache: HIT | MISS header for debugging.
 */
export function cacheResponse(ttlMs) {
  return (req, res, next) => {
    if (!ttlMs || req.method !== 'GET') return next()

    const key = req.originalUrl
    const hit = cacheGet(key)
    if (hit !== undefined) {
      res.set('X-Cache', 'HIT')
      res.set('Cache-Control', `public, max-age=${Math.floor(ttlMs / 1000)}`)
      return res.json(hit)
    }

    const originalJson = res.json.bind(res)
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(key, body, ttlMs)
      }
      res.set('X-Cache', 'MISS')
      res.set('Cache-Control', `public, max-age=${Math.floor(ttlMs / 1000)}`)
      return originalJson(body)
    }
    next()
  }
}
