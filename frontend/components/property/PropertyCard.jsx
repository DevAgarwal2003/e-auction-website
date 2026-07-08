import Link from 'next/link'
import { MapPin, Landmark, Ruler, CalendarDays, TrendingDown, ArrowRight } from 'lucide-react'
import StatusBadge from './StatusBadge'
import PropertyImage from './PropertyImage'
import { Badge } from '@/components/ui/badge'
import { formatINR, formatDate, daysUntil } from '@/lib/format'
import { cn } from '@/lib/utils'

const SHORT_BANK = { 'State Bank of India': 'SBI', 'Punjab National Bank': 'PNB' }

export default function PropertyCard({ property, className }) {
  const days = daysUntil(property.auctionDate)

  const locationText =
    [property.locality, property.city, property.state].filter(Boolean).join(', ') ||
    'Location on request'
  const areaText =
    property.area != null
      ? `${Number(property.area).toLocaleString('en-IN')} ${property.areaUnit || ''}`.trim()
      : null
  const bankText = property.bank ? SHORT_BANK[property.bank] || property.bank : null

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-navy-200 hover:shadow-lift',
        className
      )}
    >
      <Link href={`/property/${property.id}`} className="block">
        <div className="relative h-52 overflow-hidden">
          <PropertyImage
            src={property.images?.[0]}
            alt={property.title}
            propertyType={property.propertyType}
            imgClassName="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3">
            <StatusBadge status={property.status} className="bg-white/90 backdrop-blur" />
          </div>
          <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5">
            {property.priceDropLabel && (
              <span className="inline-flex max-w-[160px] items-center gap-1 truncate rounded-full bg-gold/95 px-2 py-0.5 text-xs font-bold text-gold-foreground">
                <TrendingDown className="h-3 w-3 shrink-0" />
                <span className="truncate">{property.priceDropLabel}</span>
              </span>
            )}
            <Badge variant="navy">{property.propertyType}</Badge>
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-900/90 via-navy-900/30 to-transparent p-4 pt-10">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-white/80">
              Reserve Price
            </p>
            <p className="font-display text-xl font-extrabold text-white">
              {property.reservePrice ? formatINR(property.reservePrice) : 'Price on request'}
            </p>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/property/${property.id}`}>
          <h3
            title={property.title}
            className="line-clamp-2 min-h-[2.6em] font-display text-[1.05rem] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary"
          >
            {property.title}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate text-sm" title={locationText}>
            {locationText}
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {areaText && (
            <div className="flex items-center gap-2 text-sm">
              <Ruler className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate font-medium">{areaText}</span>
            </div>
          )}
          {bankText && (
            <div className="flex items-center gap-2 text-sm">
              <Landmark className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate font-medium" title={bankText}>
                {bankText}
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto" />
        <div className="my-4 h-px bg-border" />

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="text-xs">
                {property.auctionDate ? formatDate(property.auctionDate) : 'Date to be announced'}
              </span>
            </div>
            {property.auctionHistory?.length > 0 && (
              <p className="mt-0.5 text-[0.72rem] font-semibold text-primary">
                {property.auctionHistory.length} prior auction
                {property.auctionHistory.length > 1 ? 's' : ''}
              </p>
            )}
            {property.status !== 'Closed' && days != null && days >= 0 && (
              <p className="mt-0.5 text-[0.72rem] font-bold text-gold-dark">
                {days === 0 ? 'Auction today' : `${days} day${days > 1 ? 's' : ''} left`}
              </p>
            )}
          </div>
          <Link
            href={`/property/${property.id}`}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-navy-800 group-hover:gap-1.5"
          >
            View
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
