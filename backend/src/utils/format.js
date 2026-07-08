// Text / currency / date helpers for messy scraped HTML.

const WS = /\s+/g
const DIGITS = /\d/g

export const cleanText = (value) => {
  if (value === null || value === undefined) return ''
  return String(value).replace(WS, ' ').trim()
}

// Parse "₹ 11,00,00,000" / "Rs. 18.5 Lakh" style strings into integer rupees.
export const parseInr = (value) => {
  if (!value) return null
  const text = String(value)
  const digits = (text.match(DIGITS) || []).join('')
  if (!digits) return null
  const n = parseInt(digits, 10)
  return Number.isFinite(n) ? n : null
}

// Pull the first integer out of a string.
export const safeInt = (value) => {
  if (!value) return null
  const m = String(value).match(/\d[\d,]*/)
  if (!m) return null
  const n = parseInt(m[0].replace(/,/g, ''), 10)
  return Number.isFinite(n) ? n : null
}

// Pull the first decimal number out of a string ("1,450.50 sq.ft" -> 1450.5).
export const parseNumber = (value) => {
  if (!value) return null
  const m = String(value).replace(/,/g, '').match(/\d+(?:\.\d+)?/)
  if (!m) return null
  const n = parseFloat(m[0])
  return Number.isFinite(n) ? n : null
}

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

// Parse common date/datetime strings into a JS Date (UTC-naive).
// Handles: "31-05-2026", "31/05/2026", "31-05-2026 11:00 AM",
// "31 May 2026", "May 31, 2026 11:00 AM".
export const parseDateTime = (value) => {
  if (!value) return null
  const text = cleanText(value)
  if (!text) return null

  // dd-mm-yyyy or dd/mm/yyyy [hh:mm[ AM/PM]]
  let m = text.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[\sT]+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i)
  if (m) {
    const [, d, mo, y, hh, mm, ap] = m
    return buildDate(+y, +mo, +d, hh, mm, ap)
  }

  // dd Mon yyyy [hh:mm AM/PM]
  m = text.match(/(\d{1,2})\s+([A-Za-z]{3,})\.?\s+(\d{4})(?:[\s,]+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/)
  if (m) {
    const [, d, monName, y, hh, mm, ap] = m
    const mo = MONTHS[monName.slice(0, 3).toLowerCase()]
    if (mo) return buildDate(+y, mo, +d, hh, mm, ap)
  }

  // Mon dd, yyyy [hh:mm AM/PM]
  m = text.match(/([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})(?:[\s,]+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/)
  if (m) {
    const [, monName, d, y, hh, mm, ap] = m
    const mo = MONTHS[monName.slice(0, 3).toLowerCase()]
    if (mo) return buildDate(+y, mo, +d, hh, mm, ap)
  }

  const native = new Date(text)
  return Number.isNaN(native.getTime()) ? null : native
}

function buildDate(year, month, day, hh, mm, ap) {
  let hours = hh != null ? parseInt(hh, 10) : 0
  const mins = mm != null ? parseInt(mm, 10) : 0
  if (ap) {
    const upper = ap.toUpperCase()
    if (upper === 'PM' && hours < 12) hours += 12
    if (upper === 'AM' && hours === 12) hours = 0
  }
  const d = new Date(Date.UTC(year, month - 1, day, hours, mins))
  return Number.isNaN(d.getTime()) ? null : d
}

// Returns YYYY-MM-DD (date only) from a Date, or null.
export const toDateOnly = (date) => (date ? date.toISOString().slice(0, 10) : null)
