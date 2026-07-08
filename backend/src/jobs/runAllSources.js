import path from 'node:path'
import { logger, logToFile } from '../utils/logger.js'
import { closePool } from '../db/pool.js'
import { getEnabledSources, getSource } from '../sources/registry.js'

/**
 * Run ingestion for every enabled source (or a subset passed as CLI args),
 * sequentially, so one failing site never aborts the others. Each source keeps
 * its own scrape_runs audit row.
 */
export async function runAllSources({ only = [] } = {}) {
  const selected = only.length
    ? only.map(getSource).filter(Boolean)
    : getEnabledSources()

  if (!selected.length) {
    logger.warn('No sources selected/enabled; nothing to do.')
    return {}
  }

  const results = {}
  for (const src of selected) {
    logger.info(`=== Ingesting source: ${src.source} (${src.label || ''}) ===`)
    const startedAt = Date.now()
    try {
      const stats = await src.run()
      results[src.source] = { ok: true, stats }
      logger.info(`=== ${src.source} done in ${Math.round((Date.now() - startedAt) / 1000)}s ===`)
    } catch (err) {
      results[src.source] = { ok: false, error: err.message }
      logger.error(`=== ${src.source} FAILED: ${err.stack || err.message} ===`)
    }
  }
  return results
}

// CLI entrypoint: `npm run scrape:all` or `node src/jobs/runAllSources.js baanknet`
const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('runAllSources.js')
if (isMain) {
  const logFile = path.resolve(process.env.LOG_FILE || 'logs.txt')
  logToFile(logFile, { console: process.env.LOG_CONSOLE === 'true' })
  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  runAllSources({ only })
    .then((results) => {
      logger.info('All sources complete.', JSON.stringify(results))
      process.exitCode = Object.values(results).some((r) => !r.ok) ? 1 : 0
    })
    .catch((err) => {
      logger.error('Multi-source run failed:', err.stack || err.message)
      process.exitCode = 1
    })
    .finally(closePool)
}
