import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { pool, closePool } from './pool.js'
import { logger } from '../utils/logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function migrate() {
  const schemaPath = join(__dirname, 'schema.sql')
  const sql = await readFile(schemaPath, 'utf-8')
  logger.info('Applying schema from', schemaPath)
  await pool.query(sql)
  logger.info('Schema applied successfully.')
}

migrate()
  .catch((err) => {
    logger.error('Migration failed:', err.message)
    process.exitCode = 1
  })
  .finally(closePool)
