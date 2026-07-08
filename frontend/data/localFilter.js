// Client-side filtering over the bundled sample data.
// Used as a graceful fallback when the backend API is unreachable.
import { properties } from './properties'
import { budgetRanges } from './locations'

const statusOrder = { Live: 0, Upcoming: 1, Closed: 2 }

export function localQuery(filters = {}, sort = 'relevance', page = 1, perPage = 9) {
  let result = properties.filter((p) => {
    if (filters.state && p.state !== filters.state) return false
    if (filters.city && p.city !== filters.city) return false
    if (filters.locality && p.locality !== filters.locality) return false
    if (filters.type && p.propertyType !== filters.type) return false
    if (filters.bank && p.bank !== filters.bank) return false
    if (filters.status && p.status !== filters.status) return false
    if (filters.budget !== '' && filters.budget != null) {
      const range = budgetRanges[Number(filters.budget)]
      if (range && (p.reservePrice < range.min || p.reservePrice > range.max)) return false
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      const hay = `${p.title} ${p.locality} ${p.city} ${p.state} ${p.subType} ${p.bank}`.toLowerCase()
      if (!hay.includes(kw)) return false
    }
    return true
  })

  switch (sort) {
    case 'price-asc':
      result = [...result].sort((a, b) => a.reservePrice - b.reservePrice)
      break
    case 'price-desc':
      result = [...result].sort((a, b) => b.reservePrice - a.reservePrice)
      break
    case 'date':
      result = [...result].sort((a, b) => new Date(a.auctionDate) - new Date(b.auctionDate))
      break
    default:
      result = [...result].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
  }

  const total = result.length
  const pageCount = Math.ceil(total / perPage)
  const start = (page - 1) * perPage
  return { total, page, pageCount, results: result.slice(start, start + perPage) }
}
