'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getFavorites,
  toggleFavorite as toggle,
  removeFavorite as remove,
  FAVORITES_EVENT,
} from '@/lib/favorites'

/**
 * Subscribes to the saved-properties list. Re-renders whenever the list changes
 * — in this tab (custom event) or another tab (native `storage` event) — so the
 * navbar count, the detail Save button, and the saved page never drift apart.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    const sync = () => setFavorites(getFavorites())
    sync()
    window.addEventListener(FAVORITES_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(FAVORITES_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const toggleFavorite = useCallback((id) => toggle(id), [])
  const removeFavorite = useCallback((id) => remove(id), [])
  const isFavorite = useCallback((id) => favorites.includes(String(id)), [favorites])

  return { favorites, count: favorites.length, toggleFavorite, removeFavorite, isFavorite }
}

export default useFavorites
