import { api } from '@/lib/api'
import { getPropertyById } from '@/data/properties'
import { formatINR } from '@/lib/format'
import PropertyDetailView from './PropertyDetailView'

async function resolveProperty(id) {
  try {
    const res = await api.getProperty(id)
    if (res?.property) return res.property
  } catch {
    /* fall through to sample */
  }
  return getPropertyById(id) || null
}

export async function generateMetadata({ params }) {
  const property = await resolveProperty(params.id)
  if (!property) {
    return { title: 'Property not found' }
  }
  const location = [property.locality, property.city, property.state].filter(Boolean).join(', ')
  const title = property.title || `${property.propertyType} in ${location}`
  const description = `${[property.subType, location].filter(Boolean).join(' in ')} — reserve price ${formatINR(
    property.reservePrice
  )}. Bank e-auction by ${property.bank || 'a leading bank'} on BidAcres.`
  const image = (property.images || []).find((src) => src && !/\.svg/.test(src))
  return {
    title,
    description,
    alternates: { canonical: `/property/${params.id}` },
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
      type: 'website',
    },
  }
}

export default async function PropertyPage({ params }) {
  return <PropertyDetailView id={params.id} />
}
