import { Router } from 'express'
import axios from 'axios'
import { config } from '../../config/env.js'
import { cacheResponse } from '../middleware/cacheResponse.js'
import { query } from '../../db/pool.js'
import { logger } from '../../utils/logger.js'
import {
  findProperties,
  getPropertyById,
  getSimilar,
} from '../../repositories/propertyQueries.js'
import { getSaleNotice } from '../../repositories/documentRepository.js'
import { getObjectStream, storageEnabled } from '../../storage/r2.js'

const router = Router()
const listCache = cacheResponse(config.api.cacheTtlListMs)
const detailCache = cacheResponse(config.api.cacheTtlDetailMs)

// Resolve the internal db id from a source_id or numeric db id.
async function resolveDbId(id) {
  const { rows } = await query(
    `SELECT id FROM properties WHERE source_id = $1 OR (id::text = $1)
     ORDER BY duplicate_of NULLS FIRST LIMIT 1`,
    [String(id)],
  )
  return rows[0]?.id || null
}

// GET /api/properties?state=&city=&locality=&type=&budget=&bank=&status=&keyword=&sort=&page=&limit=
router.get('/', listCache, async (req, res, next) => {
  try {
    const data = await findProperties(req.query)
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// GET /api/properties/:id/sale-notice
// Streams the property's sale-notice PDF from object storage when mirrored, or
// transparently proxies the original bank URL otherwise, always as a download.
router.get('/:id/sale-notice', async (req, res, next) => {
  try {
    const dbId = await resolveDbId(req.params.id)
    if (!dbId) return res.status(404).json({ error: 'Property not found' })
    const notice = await getSaleNotice(dbId)
    if (!notice) return res.status(404).json({ error: 'No sale notice available' })

    const fileName = notice.file_name || `sale-notice-${req.params.id}.pdf`
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

    // Prefer the mirrored copy in object storage.
    if (notice.storage_key && storageEnabled()) {
      const obj = await getObjectStream(notice.storage_key)
      if (obj?.body) {
        res.setHeader('Content-Type', obj.contentType || notice.mime_type || 'application/pdf')
        if (obj.contentLength) res.setHeader('Content-Length', obj.contentLength)
        return obj.body.pipe(res)
      }
    }

    // Fall back to proxying the original source URL. Send a same-origin Referer
    // (some bank portals only serve /public/uploads files when it is present).
    if (notice.source_url) {
      let referer
      try {
        referer = `${new URL(notice.source_url).origin}/`
      } catch {
        referer = undefined
      }
      const upstream = await axios.get(notice.source_url, {
        responseType: 'stream',
        timeout: config.bankeauctions.requestTimeoutMs,
        headers: { 'User-Agent': config.bankeauctions.userAgent, Referer: referer },
      })
      res.setHeader('Content-Type', upstream.headers['content-type'] || notice.mime_type || 'application/pdf')
      if (upstream.headers['content-length']) res.setHeader('Content-Length', upstream.headers['content-length'])
      return upstream.data.pipe(res)
    }

    return res.status(404).json({ error: 'Sale notice source unavailable' })
  } catch (err) {
    logger.warn(`sale-notice download failed for ${req.params.id}: ${err.message}`)
    if (!res.headersSent) return next(err)
    return res.end()
  }
})

// GET /api/properties/:id  (id = baanknet source id or internal db id)
router.get('/:id', detailCache, async (req, res, next) => {
  try {
    const property = await getPropertyById(req.params.id)
    if (!property) return res.status(404).json({ error: 'Property not found' })
    const similar = await getSimilar(property, 3)
    res.json({ property, similar })
  } catch (err) {
    next(err)
  }
})

export default router
