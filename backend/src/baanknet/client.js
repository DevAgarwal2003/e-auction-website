import https from 'node:https'
import axios from 'axios'
import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Thin JSON client for the BAANKNET (baanknet.com) public e-auction API.
 *
 * baanknet is an Angular single-page app; all data is served from a JSON REST
 * API under `<origin><contextPath>/api` (guest / before-login context). This
 * client talks to that API directly instead of scraping rendered HTML.
 *
 * Responsibilities:
 *  - Browser-like headers + a tiny cookie jar (the server sets an XSRF-TOKEN
 *    cookie on the first request; some POST endpoints expect it echoed back).
 *  - Polite throttling + exponential-backoff retries.
 *  - Convenience get()/post() helpers returning parsed JSON.
 */
export class BaanknetClient {
  constructor(opts = {}) {
    this.cfg = config.baanknet
    this.baseUrl = opts.baseUrl || config.apiBaseUrl
    this.origin = this.cfg.origin
    this.cookies = new Map()
    this._lastRequestAt = 0
    this._primed = false

    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: this.cfg.requestTimeoutMs,
      maxRedirects: 5,
      validateStatus: (s) => s < 500,
      httpsAgent: this.cfg.insecureTls
        ? new https.Agent({ rejectUnauthorized: false })
        : undefined,
      headers: {
        'User-Agent': this.cfg.userAgent,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        Origin: this.origin,
        Referer: `${this.origin}/`,
      },
    })

    this.http.interceptors.request.use((req) => {
      const cookie = this._cookieHeader()
      if (cookie) req.headers.Cookie = cookie
      // Echo the XSRF token the same way the baanknet frontend does.
      const xsrf = this.cookies.get('XSRF-TOKEN')
      if (xsrf) req.headers['X-Xsrf-Token'] = xsrf
      return req
    })
    this.http.interceptors.response.use((res) => {
      this._storeCookies(res.headers['set-cookie'])
      return res
    })
  }

  _cookieHeader() {
    if (this.cookies.size === 0) return ''
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
  }

  _storeCookies(setCookie) {
    if (!setCookie) return
    for (const line of setCookie) {
      const [pair] = line.split(';')
      const idx = pair.indexOf('=')
      if (idx === -1) continue
      const name = pair.slice(0, idx).trim()
      const value = pair.slice(idx + 1).trim()
      if (name) this.cookies.set(name, value)
    }
  }

  async _throttle() {
    const wait = this._lastRequestAt + this.cfg.delayMs - Date.now()
    if (wait > 0) await sleep(wait)
    this._lastRequestAt = Date.now()
  }

  /** Make one lightweight GET so the server hands us session/XSRF cookies. */
  async prime() {
    if (this._primed) return
    this._primed = true
    try {
      await this._request('get', '/fetch-server-datetime')
    } catch (err) {
      logger.warn(`baanknet prime request failed (continuing): ${err.message}`)
    }
  }

  async get(path, params) {
    await this.prime()
    return this._request('get', path, { params })
  }

  async post(path, body, params) {
    await this.prime()
    return this._request('post', path, { data: body ?? {}, params })
  }

  async _request(method, path, opts = {}) {
    let attempt = 0
    let lastErr
    while (attempt <= this.cfg.maxRetries) {
      try {
        await this._throttle()
        const res = await this.http.request({ method, url: path, ...opts })
        if (res.status === 404) {
          const err = new Error(`404 Not Found: ${path}`)
          err.code = 'NOT_FOUND'
          throw err
        }
        if (res.status === 429 || res.status >= 500) {
          throw new Error(`HTTP ${res.status} for ${path}`)
        }
        if (res.status >= 400) {
          const err = new Error(`HTTP ${res.status} for ${path}: ${JSON.stringify(res.data).slice(0, 200)}`)
          err.code = 'CLIENT_ERROR'
          err.status = res.status
          throw err
        }
        return res.data
      } catch (err) {
        if (err.code === 'NOT_FOUND' || err.code === 'CLIENT_ERROR') throw err
        lastErr = err
        const backoff = Math.min(8000, 500 * 2 ** attempt) + Math.random() * 300
        logger.warn(
          `baanknet request failed (attempt ${attempt + 1}/${this.cfg.maxRetries + 1}) ${method.toUpperCase()} ${path}: ${err.message}. Retrying in ${Math.round(backoff)}ms`,
        )
        await sleep(backoff)
        attempt += 1
      }
    }
    throw lastErr || new Error(`Failed to ${method.toUpperCase()} ${path}`)
  }
}

export default BaanknetClient
