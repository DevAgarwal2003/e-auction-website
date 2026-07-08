'use client'

import { useState } from 'react'
import { Home, Store, Factory, Sprout, Car, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_ICON = {
  Residential: Home,
  Commercial: Store,
  Industrial: Factory,
  Agricultural: Sprout,
  Vehicle: Car,
}

// Scraped listings often only carry a bank logo (which looks broken when
// stretched) or no real photo. Treat those as "no image".
export function isUsableImage(src) {
  if (!src || typeof src !== 'string') return false
  if (/banklogo|\/static\/images\//i.test(src)) return false
  if (/\.svg(\?|$)/i.test(src)) return false
  return true
}

export default function PropertyImage({ src, alt = '', propertyType, className, imgClassName }) {
  const [failed, setFailed] = useState(false)
  const showImage = isUsableImage(src) && !failed

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn('h-full w-full object-cover', imgClassName, className)}
      />
    )
  }

  const Icon = TYPE_ICON[propertyType] || ImageOff

  return (
    <div
      aria-label={`${propertyType || 'Property'} — no image available`}
      className={cn(
        'relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden bg-brand-soft text-white/90',
        className
      )}
    >
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1.5px)',
          backgroundSize: '18px 18px',
        }}
      />
      <Icon className="relative h-10 w-10" />
      <span className="relative text-sm font-semibold tracking-wide">{propertyType || 'Property'}</span>
    </div>
  )
}
