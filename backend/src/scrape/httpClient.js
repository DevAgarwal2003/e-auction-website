import https from 'node:https'
import axios from 'axios'
import { logger } from '../utils/logger.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Generic, polite HTTP client shared by HTML/JSON scrapers.
 *
 * Provides browser-like headers, a tiny cookie jar, request throttling and
 * exponential-backoff retries. Unlike the BAANKNET client this one is source
 * agnostic: callers pass a base URL and per-source politeness settings.
 */
export class HttpClient {
  constructor({
    baseUrl,
    origin,
    userAgent,
    timeoutMs = 30000,
    delayMs = 300,
    maxRetries = 3,
    insecureTls = false,
    headers = {},
  } = {}) {
    this.baseUrl = baseUrl
    this.origin = origin || baseUrl
    this.delayMs = delayMs
    this.maxRetries = maxRetries
    this.cookies = new Map()
    this._lastRequestAt = 0

    this.http = axios.create({
      baseURL: baseUrl,
      timeout: timeoutMs,
      maxRedirects: 5,
      validateStatus: (s) => s < 500,
      httpsAgent: insecureTls ? new https.Agent({ rejectUnauthorized: false }) : undefined,
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': 'en-US,en;q=0.9',
        Origin: this.origin,
        Referer: `${this.origin}/`,
        ...headers,
      },
    })

    this.http.interceptors.request.use((req) => {
      const cookie = this._cookieHeader()
      if (cookie) req.headers.Cookie = cookie
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
    const wait = this._lastRequestAt + this.delayMs - Date.now()
    if (wait > 0) await sleep(wait)
    this._lastRequestAt = Date.now()
  }

  /** GET returning the raw response body (HTML string or parsed JSON). */
  async get(path, opts = {}) {
    return this._request('get', path, opts)
  }

  /** POST an application/x-www-form-urlencoded body. */
  async postForm(path, form = {}, opts = {}) {
    const body = new URLSearchParams()
    for (const [k, v] of Object.entries(form)) body.append(k, v == null ? '' : String(v))
    return this._request('post', path, {
      ...opts,
      data: body.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(opts.headers || {}) },
    })
  }

  async _request(method, path, opts = {}) {
    let attempt = 0
    let lastErr
    while (attempt <= this.maxRetries) {
      try {
        await this._throttle()
        const res = await this.http.request({ method, url: path, ...opts })
        if (res.status === 404) {
          const err = new Error(`404 Not Found: ${path}`)
          err.code = 'NOT_FOUND'
          throw err
        }
        if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status} for ${path}`)
        if (res.status >= 400) {
          const err = new Error(`HTTP ${res.status} for ${path}`)
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
          `request failed (attempt ${attempt + 1}/${this.maxRetries + 1}) ${method.toUpperCase()} ${path}: ${err.message}. Retrying in ${Math.round(backoff)}ms`,
        )
        await sleep(backoff)
        attempt += 1
      }
    }
    throw lastErr || new Error(`Failed to ${method.toUpperCase()} ${path}`)
  }
}

export default HttpClient
