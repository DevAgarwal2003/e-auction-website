import express from 'express'
import cors from 'cors'
import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { pool } from '../db/pool.js'
import propertiesRouter from './routes/properties.js'
import metaRouter from './routes/meta.js'

const app = express()

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin/non-browser (no origin) and any configured origin.
      if (!origin || config.api.corsOrigins.includes(origin)) return cb(null, true)
      cb(null, false)
    },
  }),
)
app.use(express.json())

app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`)
  next()
})

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'up' })
  } catch (err) {
    res.status(503).json({ status: 'degraded', db: 'down', error: err.message })
  }
})

app.use('/api/properties', propertiesRouter)
app.use('/api/meta', metaRouter)

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

// Centralized error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled API error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

const server = app.listen(config.api.port, () => {
  logger.info(`API listening on http://localhost:${config.api.port}`)
  // Warm the Neon/Postgres connection so the first user request isn't slow.
  pool
    .query('SELECT 1')
    .then(() => logger.info('Database connection ready'))
    .catch((err) => logger.warn('Database warmup failed:', err.message))
})

const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down...`)
  server.close()
  await pool.end().catch(() => {})
  process.exit(0)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

export default app
