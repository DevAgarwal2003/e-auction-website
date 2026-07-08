import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'

// The S3 client is created lazily so the AWS SDK is only loaded/required when
// object storage is actually configured. Everything degrades gracefully to
// "not configured" otherwise (the download endpoint then proxies source URLs).
let _clientPromise = null

export const storageEnabled = () => config.storage.enabled

async function getClient() {
  if (!storageEnabled()) return null
  if (!_clientPromise) {
    _clientPromise = (async () => {
      const { S3Client } = await import('@aws-sdk/client-s3')
      return new S3Client({
        region: config.storage.region,
        endpoint: config.storage.endpoint,
        credentials: {
          accessKeyId: config.storage.accessKeyId,
          secretAccessKey: config.storage.secretAccessKey,
        },
      })
    })().catch((err) => {
      logger.error('Failed to initialise object storage client:', err.message)
      _clientPromise = null
      throw err
    })
  }
  return _clientPromise
}

/** Upload a Buffer under `key`. Returns the key on success, null on failure. */
export async function putObject(key, body, contentType = 'application/octet-stream') {
  const client = await getClient()
  if (!client) return null
  const { PutObjectCommand } = await import('@aws-sdk/client-s3')
  await client.send(
    new PutObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
  return key
}

/** Fetch an object as a readable stream (for the download proxy). */
export async function getObjectStream(key) {
  const client = await getClient()
  if (!client) return null
  const { GetObjectCommand } = await import('@aws-sdk/client-s3')
  const res = await client.send(
    new GetObjectCommand({ Bucket: config.storage.bucket, Key: key }),
  )
  return { body: res.Body, contentType: res.ContentType, contentLength: res.ContentLength }
}

/** Public URL for a stored object, when a public base URL is configured. */
export function publicUrl(key) {
  if (!key || !config.storage.publicBaseUrl) return null
  return `${config.storage.publicBaseUrl}/${key.replace(/^\/+/, '')}`
}
