import path from 'node:path'
import cron from 'node-cron'
import { config } from '../config/env.js'
import { logger, logToFile } from '../utils/logger.js'
import { runAllSources } from './runAllSources.js'

/**
 * Long-running scheduler that refreshes every source on a weekly cron.
 * Run with `npm run schedule`. Keep this process alive (pm2, a systemd unit, a
 * container, etc). Alternatively, skip this and call `npm run scrape:all` from
 * an external scheduler (Windows Task Scheduler / a cloud cron).
 */
const logFile = path.resolve(process.env.LOG_FILE || 'logs.txt')
logToFile(logFile, { console: process.env.LOG_CONSOLE !== 'false' })

let running = false
async function runOnce(trigger) {
  if (running) {
    logger.warn(`Skipping ${trigger} run: a previous run is still in progress.`)
    return
  }
  running = true
  logger.info(`Scheduled ingest triggered (${trigger}).`)
  try {
    const results = await runAllSources()
    logger.info('Scheduled ingest complete.', JSON.stringify(results))
  } catch (err) {
    logger.error('Scheduled ingest failed:', err.stack || err.message)
  } finally {
    running = false
  }
}

if (!cron.validate(config.cron.schedule)) {
  logger.error(`Invalid CRON_SCHEDULE "${config.cron.schedule}". Aborting.`)
  process.exit(1)
}

cron.schedule(config.cron.schedule, () => runOnce('cron'), { timezone: config.cron.timezone })
logger.info(`Scheduler started. Schedule="${config.cron.schedule}" timezone=${config.cron.timezone}`)

if (config.cron.runOnStart) runOnce('startup')

// Keep the process alive.
process.on('SIGINT', () => {
  logger.info('Scheduler shutting down.')
  process.exit(0)
})
