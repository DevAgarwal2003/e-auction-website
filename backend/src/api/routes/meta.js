import { Router } from 'express'
import { config } from '../../config/env.js'
import { cacheResponse } from '../middleware/cacheResponse.js'
import { getFilterMeta, getStats } from '../../repositories/propertyQueries.js'

const router = Router()
const metaCache = cacheResponse(config.api.cacheTtlMetaMs)

// GET /api/meta/filters -> dropdown options derived from live data
router.get('/filters', metaCache, async (_req, res, next) => {
  try {
    res.json(await getFilterMeta())
  } catch (err) {
    next(err)
  }
})

// GET /api/meta/stats -> homepage headline numbers
router.get('/stats', metaCache, async (_req, res, next) => {
  try {
    res.json(await getStats())
  } catch (err) {
    next(err)
  }
})

export default router
