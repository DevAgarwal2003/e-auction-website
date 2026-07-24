// Saved-properties store backed by the browser's localStorage.
// A custom event lets every mounted component (navbar count, detail button,
// saved page) stay in sync when the list changes within the same tab, while the
// native `storage` event covers changes made in other tabs.
'use client'

export const FAVORITES_KEY = 'bidacres:favorites'
export const FAVORITES_EVENT = 'bidacres:favorites-changed'

export function getFavorites() {
  if (typeof window === 'undefined') return []
  try {
    const list = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
    return Array.isArray(list) ? list.map(String) : []
  } catch {
    return []
  }
}

export function isFavorite(id) {
  return getFavorites().includes(String(id))
}

function persist(list) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list))
    window.dispatchEvent(new Event(FAVORITES_EVENT))
  } catch {
    /* storage unavailable (private mode / quota) — ignore */
  }
}

export function addFavorite(id) {
  const pid = String(id)
  const list = getFavorites()
  if (!list.includes(pid)) persist([...list, pid])
}

export function removeFavorite(id) {
  const pid = String(id)
  persist(getFavorites().filter((x) => x !== pid))
}

// Toggles membership and returns the new saved state (true = now saved).
export function toggleFavorite(id) {
  const pid = String(id)
  const list = getFavorites()
  const next = list.includes(pid) ? list.filter((x) => x !== pid) : [...list, pid]
  persist(next)
  return next.includes(pid)
}
