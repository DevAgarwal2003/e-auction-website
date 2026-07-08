import baanknet from './baanknet/index.js'
import bankeauctions from './bankeauctions/index.js'

/**
 * The registry of ingestion sources. Each adapter exposes:
 *   { source, label, enabled, run(options) -> stats }
 * Add a new bank portal by dropping a folder under sources/ and registering it
 * here; the runner and scheduler pick it up automatically.
 */
export const sources = [baanknet, bankeauctions]

export function getSource(name) {
  return sources.find((s) => s.source === name) || null
}

export function getEnabledSources() {
  return sources.filter((s) => s.enabled !== false)
}

export default sources
