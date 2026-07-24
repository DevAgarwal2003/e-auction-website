'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { peekCache } from '@/lib/cache'
import {
  locations as staticLocations,
  states as staticStates,
  propertyTypes as staticTypes,
  banks as staticBanks,
} from '@/data/locations'

// Derive city / locality option lists from a nested locations object.
export const citiesFrom = (locations, state) =>
  state && locations[state] ? Object.keys(locations[state]).sort() : []

// Some source records store a full comma-separated address in the locality
// field. Keep only concise, locality-like names so the dropdown stays usable.
const isCleanLocality = (value) => {
  const v = String(value || '').trim()
  if (!v) return false
  if (v.length > 40) return false
  if (v.includes(',')) return false
  if (/\d{5,}/.test(v)) return false // pincodes / long digit runs => likely an address
  return true
}

export const localitiesFrom = (locations, state, city) =>
  state && city && locations[state] && locations[state][city]
    ? locations[state][city].filter(isCleanLocality)
    : []

/**
 * Loads filter dropdown options from the backend, falling back to the bundled
 * sample data when the API is unreachable (e.g. before the DB is populated).
 */
export function useFilterMeta() {
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    let active = true
    const cached = peekCache('/api/meta/filters', null)
    if (cached && Array.isArray(cached.states)) setMeta(cached)

    api
      .filterMeta({ bypassCache: Boolean(cached) })
      .then((d) => {
        if (active && d && Array.isArray(d.states)) setMeta(d)
      })
      .catch(() => {
        /* keep static fallback */
      })
    return () => {
      active = false
    }
  }, [])

  const hasLive = meta && meta.locations && Object.keys(meta.locations).length > 0

  return {
    live: Boolean(hasLive),
    locations: hasLive ? meta.locations : staticLocations,
    states: meta?.states?.length ? meta.states : staticStates,
    propertyTypes: meta?.propertyTypes?.length ? meta.propertyTypes.map((t) => t.type) : staticTypes,
    banks: meta?.banks?.length ? meta.banks : staticBanks,
    statuses: meta?.statuses?.map((s) => s.status) || ['Live', 'Upcoming', 'Closed'],
  }
}

export default useFilterMeta
