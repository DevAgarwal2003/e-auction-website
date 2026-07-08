'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  MapPin,
  Heart,
  Share2,
  CalendarDays,
  Clock,
  Landmark,
  Ruler,
  Building2,
  KeyRound,
  Wallet,
  ShieldCheck,
  ChevronRight,
  FileDown,
} from 'lucide-react'
import Container from '@/components/common/Container'
import SectionHeading from '@/components/common/SectionHeading'
import StatusBadge from '@/components/property/StatusBadge'
import PropertyCard from '@/components/property/PropertyCard'
import PropertyImage, { isUsableImage } from '@/components/property/PropertyImage'
import AuctionHistorySection from '@/components/property/AuctionHistorySection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { peekCache } from '@/lib/cache'
import { getPropertyById, properties } from '@/data/properties'
import { formatINR, formatINRFull, formatDate, formatTime, daysUntil } from '@/lib/format'

const SOURCE_LABELS = {
  baanknet: 'BAANKNET',
  bankeauctions: 'BankeAuctions',
}

function formatDescription(text) {
  if (!text) return []
  const byLine = String(text)
    .split(/\n{1,}|\r/)
    .map((s) => s.trim())
    .filter(Boolean)
  const chunks = []
  for (const line of byLine) {
    const sentences = line.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [line]
    for (let i = 0; i < sentences.length; i += 2) {
      const para = sentences.slice(i, i + 2).join(' ').trim()
      if (para) chunks.push(para)
    }
  }
  return chunks
}

function loadProperty(id, { bypassCache = false } = {}) {
  return api
    .getProperty(id, { bypassCache })
    .then((res) => ({ property: res.property, similar: res.similar || [] }))
    .catch(() => {
      const property = getPropertyById(id)
      if (!property) return { property: null, similar: [] }
      const similar = properties
        .filter((p) => p.id !== property.id && p.propertyType === property.propertyType)
        .slice(0, 3)
      return { property, similar }
    })
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-bold">{value}</p>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <Container className="py-10">
      <Skeleton className="mb-6 h-4 w-64" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Skeleton className="mb-4 h-[420px] w-full rounded-2xl" />
          <Skeleton className="mb-2 h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    </Container>
  )
}

export default function PropertyDetailView({ id }) {
  const router = useRouter()
  const [activeImg, setActiveImg] = useState(0)
  const [property, setProperty] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setActiveImg(0)
    const cached = peekCache(`/api/properties/${encodeURIComponent(id)}`, null)
    if (cached?.property) {
      setProperty(cached.property)
      setSimilar(cached.similar || [])
      setLoading(false)
    } else {
      setLoading(true)
    }
    loadProperty(id, { bypassCache: Boolean(cached) }).then(({ property, similar }) => {
      if (!active) return
      setProperty(property)
      setSimilar(similar)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [id])

  if (loading) return <DetailSkeleton />

  if (!property) {
    return (
      <Container className="py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Property not found</h1>
        <p className="mt-2 text-muted-foreground">
          This listing may have been removed or the link is incorrect.
        </p>
        <Button asChild className="mt-6">
          <Link href="/auctions">Back to Listings</Link>
        </Button>
      </Container>
    )
  }

  const days = daysUntil(property.auctionDate)
  const saleNoticeHref = property.saleNoticeUrl ? `${api.baseUrl}${property.saleNoticeUrl}` : null
  const sourceLabel = SOURCE_LABELS[property.source] || null
  const images = (property.images || []).filter(isUsableImage)
  const hasGallery = images.length > 1
  const startTime = formatTime(property.auctionStartTime)
  const endTime = formatTime(property.auctionEndTime)
  const descriptionParas = formatDescription(property.description)

  return (
    <div className="min-h-screen bg-background pb-16">
      <Container className="pt-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/auctions" className="transition-colors hover:text-primary">
            Auctions
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{property.id}</span>
        </nav>

        <button
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left */}
          <div className="lg:col-span-8">
            <div className="relative h-[300px] overflow-hidden rounded-2xl md:h-[440px]">
              <PropertyImage
                src={images[activeImg]}
                alt={property.title}
                propertyType={property.propertyType}
              />
              <div className="absolute left-4 top-4">
                <StatusBadge status={property.status} className="bg-white/90 backdrop-blur" />
              </div>
            </div>

            {hasGallery && (
              <div className="mt-3 flex flex-wrap gap-3">
                {images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`thumbnail ${i + 1}`}
                    loading="lazy"
                    onClick={() => setActiveImg(i)}
                    className={`h-[70px] w-24 cursor-pointer rounded-lg object-cover ring-2 ring-offset-2 transition-all ${
                      activeImg === i ? 'ring-gold' : 'ring-transparent hover:ring-navy-200'
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="mt-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="muted">
                  {[property.propertyType, property.subType].filter(Boolean).join(' • ')}
                </Badge>
                {sourceLabel && (
                  <Badge variant="secondary" title={`Listed on ${sourceLabel}`}>
                    via {sourceLabel}
                  </Badge>
                )}
              </div>
              <h1 className="font-display text-2xl font-extrabold md:text-3xl text-balance">
                {property.title}
              </h1>
              <div className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>
                  {property.address ||
                    [property.locality, property.city, property.state].filter(Boolean).join(', ') ||
                    'Location available to registered bidders'}
                </span>
              </div>
            </div>

            <div className="my-6 h-px bg-border" />

            <h2 className="mb-4 font-display text-lg font-semibold">Property Details</h2>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              <DetailItem
                icon={Building2}
                label="Property Type"
                value={property.subType || property.propertyType || '—'}
              />
              <DetailItem
                icon={Ruler}
                label="Area"
                value={
                  property.area
                    ? `${property.area.toLocaleString('en-IN')} ${property.areaUnit || ''}`.trim()
                    : '—'
                }
              />
              <DetailItem icon={KeyRound} label="Possession" value={property.possession || '—'} />
              <DetailItem icon={Landmark} label="Bank" value={property.bank || '—'} />
              <DetailItem icon={CalendarDays} label="Auction Date" value={formatDate(property.auctionDate)} />
              <DetailItem
                icon={Clock}
                label="Auction Time"
                value={startTime ? `${startTime}${endTime ? ` - ${endTime}` : ''}` : '—'}
              />
            </div>

            <AuctionHistorySection
              auctionHistory={property.auctionHistory}
              currentReservePrice={property.reservePrice}
              priceDropLabel={property.priceDropLabel}
              previousReservePrice={property.previousReservePrice}
            />

            <div className="my-6 h-px bg-border" />

            <h2 className="mb-3 font-display text-lg font-semibold">Description</h2>
            {descriptionParas.length > 0 ? (
              <div className="space-y-3">
                {descriptionParas.map((para, i) => (
                  <p key={i} className="leading-relaxed text-muted-foreground">
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <p className="leading-relaxed text-muted-foreground">
                {`${[property.subType, property.locality && `in ${property.locality}`, property.city]
                  .filter(Boolean)
                  .join(' ')}. Full auction notice and detailed description are available to registered bidders.`}
              </p>
            )}

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-success/20 bg-success/[0.08] p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div>
                <p className="font-bold text-success">Bank-Verified Listing</p>
                <p className="text-sm text-muted-foreground">
                  Title documents for this property have been verified by{' '}
                  {property.bank || 'the lending bank'}. Bidders are advised to conduct their own due
                  diligence before participating.
                </p>
              </div>
            </div>
          </div>

          {/* Right sticky panel */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reserve Price
                </p>
                <p className="font-display text-3xl font-extrabold text-primary">
                  {formatINR(property.reservePrice)}
                </p>
                <p className="text-sm text-muted-foreground">{formatINRFull(property.reservePrice)}</p>

                <div className="my-5 h-px bg-border" />

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Wallet className="h-4 w-4" />
                      EMD Amount
                    </span>
                    <span className="font-bold">{formatINR(property.emd)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Auction Date
                    </span>
                    <span className="font-bold">{formatDate(property.auctionDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Landmark className="h-4 w-4" />
                      Property ID
                    </span>
                    <span className="font-bold">{property.id}</span>
                  </div>
                </div>

                {property.status !== 'Closed' && days != null && days >= 0 && (
                  <div className="mt-5 rounded-xl bg-gold/15 px-4 py-3 text-center">
                    <p className="font-bold text-gold-dark">
                      {days === 0 ? 'Auction is today!' : `${days} day${days > 1 ? 's' : ''} until auction`}
                    </p>
                  </div>
                )}

                {saleNoticeHref && (
                  <Button asChild className="mt-5 w-full">
                    <a href={saleNoticeHref} target="_blank" rel="noopener noreferrer">
                      <FileDown className="h-4 w-4" />
                      Download Sale Notice
                    </a>
                  </Button>
                )}

                <div className="mt-3 flex gap-3">
                  <Button variant="outline" className="w-full">
                    <Heart className="h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                <p className="font-bold">Need assistance?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Our auction specialists can guide you through the bidding process.
                </p>
                <Button variant="ghost" className="mt-2 w-full justify-center text-primary">
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div className="mt-16">
            <SectionHeading align="left" title="Similar Properties" className="mb-6" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}
