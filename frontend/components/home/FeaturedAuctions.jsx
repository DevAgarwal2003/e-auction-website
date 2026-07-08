'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Container from '@/components/common/Container'
import SectionHeading from '@/components/common/SectionHeading'
import { Button } from '@/components/ui/button'
import PropertyCard from '@/components/property/PropertyCard'
import PropertyCardSkeleton from '@/components/property/PropertyCardSkeleton'
import { properties } from '@/data/properties'
import { api } from '@/lib/api'

const sampleFeatured = properties.filter((p) => p.featured).slice(0, 6)

export default function FeaturedAuctions() {
  const [featured, setFeatured] = useState(null)

  useEffect(() => {
    let active = true
    api
      .listProperties({ sort: 'relevance', page: 1, limit: 6 })
      .then((res) => {
        if (active) setFeatured(res.results?.length ? res.results : sampleFeatured)
      })
      .catch(() => {
        if (active) setFeatured(sampleFeatured)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="bg-navy-50/70 py-16 md:py-24">
      <Container>
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Featured Listings"
            title="Handpicked Auction Properties"
            subtitle="Premium opportunities curated from across our partner banks."
            className="mb-0"
          />
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/auctions">
              View All Auctions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured === null
            ? Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)
            : featured.map((property) => <PropertyCard key={property.id} property={property} />)}
        </div>
      </Container>
    </section>
  )
}
