'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, HeartOff, SearchX } from 'lucide-react'
import Container from '@/components/common/Container'
import PropertyCard from '@/components/property/PropertyCard'
import PropertyCardSkeleton from '@/components/property/PropertyCardSkeleton'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { getPropertyById as getLocalProperty } from '@/data/properties'
import { useFavorites } from '@/hooks/useFavorites'

export default function SavedView() {
  const { favorites, removeFavorite } = useFavorites()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    if (favorites.length === 0) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all(
      favorites.map((id) =>
        api
          .getProperty(id)
          .then((res) => res.property)
          .catch(() => getLocalProperty(id) || null),
      ),
    ).then((results) => {
      if (!active) return
      // Preserve the saved order and drop any listings that no longer resolve.
      setItems(results.filter(Boolean))
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [favorites])

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-brand-gradient text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(245,179,1,0.25),transparent_70%)]" />
        <Container className="relative py-10 md:py-14">
          <h1 className="flex items-center gap-2.5 font-display text-3xl font-extrabold md:text-4xl">
            <Heart className="h-7 w-7 fill-current text-gold" />
            Saved Properties
          </h1>
          <p className="mt-1.5 text-white/80">
            {favorites.length > 0
              ? `${favorites.length} ${favorites.length === 1 ? 'property' : 'properties'} saved on this device.`
              : 'Properties you save will appear here for quick access.'}
          </p>
        </Container>
      </div>

      <Container className="py-8 md:py-12">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: Math.min(favorites.length || 3, 6) }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((property) => (
              <div key={property.id} className="flex flex-col gap-2">
                <PropertyCard property={property} />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-destructive"
                  onClick={() => removeFavorite(property.id)}
                >
                  <HeartOff className="h-4 w-4" />
                  Remove from saved
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
            <SearchX className="mx-auto mb-3 h-14 w-14 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold">No saved properties yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Browse the auctions and tap the Save button on any property to keep it here for later.
            </p>
            <Button asChild className="mt-4">
              <Link href="/auctions">Browse Auctions</Link>
            </Button>
          </div>
        )}
      </Container>
    </div>
  )
}
