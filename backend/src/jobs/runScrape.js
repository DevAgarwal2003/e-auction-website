import path from 'node:path'
import { runIngest } from '../services/ingestService.js'
import { closePool } from '../db/pool.js'
import { logger, logToFile } from '../utils/logger.js'

// CLI entrypoint: `npm run scrape`
// Honors the BAANKNET_* env vars (property types, max pages, fetch details).
// All scrape output goes to a log file only (override path with LOG_FILE).
// Set LOG_CONSOLE=true to also print logs to the terminal.
const logFile = path.resolve(process.env.LOG_FILE || 'logs.txt')
const logConsole = process.env.LOG_CONSOLE === 'true'
logToFile(logFile, { console: logConsole })
logger.info(`Logging to ${logFile}${logConsole ? ' (also mirroring to console)' : ''}`)

runIngest()
  .then((stats) => {
    logger.info('Done.', JSON.stringify(stats))
    process.exitCode = 0
  })
  .catch((err) => {
    logger.error('Scrape run failed:', err.stack || err.message)
    process.exitCode = 1
  })
  .finally(closePool)
