// Minimal leveled logger with timestamps — no external dependency.
import fs from 'node:fs'
import { format } from 'node:util'

const ts = () => new Date().toISOString()

const fmt = (level, args) => [`[${ts()}] ${level}`, ...args]

// Optional file sink: when enabled, log lines are appended to a file.
let fileStream = null
let mirrorConsole = false

/**
 * Send all log output to `filePath`. By default also mirrors to the console;
 * pass `{ console: false }` to write file-only (used by the scrape job).
 * Appends, so logs from multiple runs accumulate.
 */
export function logToFile(filePath, { console: toConsole = true } = {}) {
  fileStream = fs.createWriteStream(filePath, { flags: 'a' })
  mirrorConsole = toConsole
  fileStream.on('error', (err) => {
    // Don't let a logging failure crash the run.
    console.error(`[${ts()}] ERROR log file write failed: ${err.message}`)
    fileStream = null
  })
  return filePath
}

const emit = (parts, consoleFn) => {
  if (mirrorConsole) consoleFn(...parts)
  if (fileStream) fileStream.write(format(...parts) + '\n')
}

export const logger = {
  info: (...args) => emit(fmt('INFO ', args), console.log),
  warn: (...args) => emit(fmt('WARN ', args), console.warn),
  error: (...args) => emit(fmt('ERROR', args), console.error),
  debug: (...args) => {
    if (process.env.DEBUG) emit(fmt('DEBUG', args), console.log)
  },
}

export default logger
