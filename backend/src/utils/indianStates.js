// Canonical Indian states/UTs and helpers to normalize messy scraped location data.

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Chandigarh',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
]

const CANONICAL_BY_KEY = Object.fromEntries(
  INDIAN_STATES.map((s) => [normalizeKey(s), s]),
)

// Re-export city -> state map (defined in cityState.js to keep one source).
import { CITY_STATE } from './cityState.js'

const CITIES_BY_STATE = {}
for (const [city, st] of Object.entries(CITY_STATE)) {
  CITIES_BY_STATE[st] ??= []
  CITIES_BY_STATE[st].push(city)
}

const REJECT_STATE_KEYS = new Set(['india', 'none', 'na', 'n a', 'not applicable'])

function normalizeKey(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/\.+$/g, '')
    .replace(/\s+/g, ' ')
}

/** Strip noise and match a canonical state name, or null. */
export function toCanonicalState(raw) {
  if (!raw) return null
  const key = normalizeKey(raw)
  if (!key || REJECT_STATE_KEYS.has(key)) return null
  if (CANONICAL_BY_KEY[key]) return CANONICAL_BY_KEY[key]
  // Allow "MAHARASHTRA" / "maharashtra."
  for (const [k, canon] of Object.entries(CANONICAL_BY_KEY)) {
    if (key === k || key.startsWith(`${k} `)) return canon
  }
  return null
}

/** Heuristic: scraped "state" field sometimes contains a full address or legal text. */
export function isLikelyAddress(text) {
  if (!text) return false
  const s = String(text).trim()
  if (s.length > 45) return true
  if (/\d{5,}/.test(s)) return true
  if (s.split(',').length >= 3) return true
  if (
    /\b(survey|village|mouja|tahsil|tehsil|dist\.|district|nh\s*no|road|plot|pincode|respectively|business\s*park|style)\b/i.test(
      s,
    )
  ) {
    return true
  }
  return false
}

/**
 * Resolve the best state for a property from scraped state/city fields.
 * Used at ingest, API read, and filter time.
 */
export function resolveState(rawState, city) {
  const cleaned = rawState ? String(rawState).trim() : ''
  if (cleaned && !isLikelyAddress(cleaned)) {
    const canon = toCanonicalState(cleaned)
    if (canon) return canon
  }
  if (city) {
    const key = normalizeKey(city)
    const fromCity = CITY_STATE[key]
    if (fromCity) return fromCity
  }
  return null
}

/** Lowercase city names in a canonical state (for SQL filters). */
export function citiesForState(state) {
  const canon = toCanonicalState(state) || state
  return (CITIES_BY_STATE[canon] || []).map((c) => c.toLowerCase())
}

export function stateForCity(city) {
  if (!city) return null
  return CITY_STATE[normalizeKey(city)] || null
}
