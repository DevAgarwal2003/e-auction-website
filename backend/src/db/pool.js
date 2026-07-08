import pg from 'pg'
import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'

// Reserve prices fit comfortably in BIGINT; make node-postgres
// return them as JS numbers (not strings) for convenience.
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)))
// NUMERIC (area) -> float
pg.types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)))

const { Pool } = pg

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
})

pool.on('error', (err) => {
  logger.error('Unexpected idle PG client error:', err.message)
})

export const query = (text, params) => pool.query(text, params)

export async function withClient(fn) {
  const client = await pool.connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}

export async function closePool() {
  await pool.end()
}

export default pool
