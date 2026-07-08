import { config } from '../../config/env.js'
import { HttpClient } from '../../scrape/httpClient.js'

/** HTTP client preconfigured for bankeauctions.com (C1 India). */
export function createClient() {
  const cfg = config.bankeauctions
  return new HttpClient({
    baseUrl: cfg.origin,
    origin: cfg.origin,
    userAgent: cfg.userAgent,
    timeoutMs: cfg.requestTimeoutMs,
    delayMs: cfg.delayMs,
    maxRetries: cfg.maxRetries,
    insecureTls: cfg.insecureTls,
    headers: { Accept: 'text/html,application/json,*/*' },
  })
}

export default createClient
