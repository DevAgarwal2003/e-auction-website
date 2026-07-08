import { createHash } from 'node:crypto'
import axios from 'axios'
import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { upsertDocument, markDocumentStored, markDocumentStatus } from '../repositories/documentRepository.js'
import { putObject, storageEnabled } from '../storage/r2.js'

const sha1 = (buf) => createHash('sha1').update(buf).digest('hex')

function fileNameFromUrl(url) {
  try {
    const pathname = new URL(url).pathname
    return decodeURIComponent(pathname.split('/').pop() || 'document.pdf')
  } catch {
    return 'document.pdf'
  }
}

// Some bank portals (e.g. bankeauctions.com) only serve /public/uploads files
// when a same-origin Referer is present; otherwise they return a tiny HTML
// placeholder. Always send the file's own origin as the Referer.
function refererFor(url) {
  try {
    return `${new URL(url).origin}/`
  } catch {
    return undefined
  }
}

function mimeFromUrl(url) {
  if (/\.pdf(\?|$)/i.test(url)) return 'application/pdf'
  if (/\.zip(\?|$)/i.test(url)) return 'application/zip'
  if (/\.(jpe?g)(\?|$)/i.test(url)) return 'image/jpeg'
  if (/\.png(\?|$)/i.test(url)) return 'image/png'
  return 'application/octet-stream'
}

/**
 * Attach a document to a property and, when object storage is configured,
 * download + mirror the bytes so it stays available after the bank removes it.
 * Never throws: failures are logged and recorded as status='failed' so an
 * ingest run is never aborted by a bad document link.
 *
 * @returns the property_documents row id (or null).
 */
export async function ingestDocument({ propertyId, sourceUrl, docType = 'sale_notice', label = null }) {
  if (!propertyId || !sourceUrl) return null

  // Always record the document so the download endpoint can proxy it even
  // when we are not mirroring bytes.
  const initialStatus = storageEnabled() ? 'pending' : 'external'
  let docId
  try {
    docId = await upsertDocument({
      propertyId,
      docType,
      label,
      sourceUrl,
      fileName: fileNameFromUrl(sourceUrl),
      mimeType: mimeFromUrl(sourceUrl),
      status: initialStatus,
    })
  } catch (err) {
    logger.warn(`Failed to record document ${sourceUrl}: ${err.message}`)
    return null
  }

  if (!storageEnabled()) return docId

  // Mirror the bytes to object storage.
  try {
    const res = await axios.get(sourceUrl, {
      responseType: 'arraybuffer',
      timeout: config.bankeauctions.requestTimeoutMs,
      maxContentLength: 50 * 1024 * 1024, // 50 MB cap
      headers: { 'User-Agent': config.bankeauctions.userAgent, Referer: refererFor(sourceUrl) },
    })
    const buf = Buffer.from(res.data)
    const mime = res.headers['content-type'] || mimeFromUrl(sourceUrl)
    const ext = (fileNameFromUrl(sourceUrl).match(/\.[a-z0-9]+$/i) || ['.pdf'])[0]
    const key = `documents/${docType}/${propertyId}-${sha1(buf).slice(0, 12)}${ext}`
    await putObject(key, buf, mime)
    await markDocumentStored(docId, { storageKey: key, byteSize: buf.length, mimeType: mime, contentHash: sha1(buf) })
    logger.debug(`Stored ${docType} for property ${propertyId} -> ${key} (${buf.length} bytes)`)
  } catch (err) {
    logger.warn(`Failed to mirror document ${sourceUrl}: ${err.message}`)
    await markDocumentStatus(docId, 'failed').catch(() => {})
  }
  return docId
}

export default { ingestDocument }
