import { Suspense } from 'react'
import ListingsView from './ListingsView'

export const metadata = {
  title: 'Browse Auction Properties',
  description:
    'Explore verified bank e-auction listings across India. Filter by state, city, property type, budget, bank and auction status.',
  alternates: { canonical: '/auctions' },
}

export default function AuctionsPage() {
  return (
    <Suspense fallback={null}>
      <ListingsView />
    </Suspense>
  )
}
