import { History, TrendingDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

function priceChange(current, previous) {
  if (!current || !previous || previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export default function AuctionHistorySection({
  auctionHistory = [],
  currentReservePrice,
  priceDropLabel,
  previousReservePrice,
}) {
  const rounds = Array.isArray(auctionHistory) ? auctionHistory : []
  const hasHistory = rounds.length > 0
  const hasDrop = Boolean(priceDropLabel || previousReservePrice)

  if (!hasHistory && !hasDrop) return null

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-semibold">Auction history</h3>
      </div>

      {hasDrop && (
        <div className="mb-4 rounded-xl border border-gold/35 bg-gold/10 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <TrendingDown className="h-5 w-5 text-gold-dark" />
            <span className="font-bold text-gold-dark">Reserve price reduced</span>
            {priceDropLabel && <Badge variant="secondary">{priceDropLabel}</Badge>}
          </div>
          {previousReservePrice && currentReservePrice && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              Previous reserve: {formatINR(previousReservePrice)} → Current:{' '}
              {formatINR(currentReservePrice)}
              {priceChange(currentReservePrice, previousReservePrice) != null && (
                <span className="ml-1 font-bold text-success">
                  ({priceChange(currentReservePrice, previousReservePrice)}%)
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {hasHistory ? (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            This property has been listed for auction before. Earlier rounds are shown below (newest
            first).
          </p>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-50 text-left">
                  <th className="px-4 py-2.5 font-bold">Auction date</th>
                  <th className="px-4 py-2.5 font-bold">Reserve price</th>
                  <th className="px-4 py-2.5 font-bold">Change</th>
                  <th className="px-4 py-2.5 font-bold">Area</th>
                  <th className="px-4 py-2.5 font-bold">Possession</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((round, i) => {
                  const prev = rounds[i + 1]
                  const change =
                    round.reservePrice && prev?.reservePrice
                      ? priceChange(round.reservePrice, prev.reservePrice)
                      : null
                  return (
                    <tr key={round.auctionId || i} className="border-t border-border hover:bg-muted/40">
                      <td className="px-4 py-2.5">
                        {formatDate(round.auctionDate) || round.auctionDate || '—'}
                      </td>
                      <td className="px-4 py-2.5 font-semibold">
                        {round.reservePrice ? formatINR(round.reservePrice) : round.reservePriceText || '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        {change != null ? (
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2 py-0.5 text-xs font-bold',
                              change < 0 ? 'bg-success/12 text-success' : 'bg-destructive/12 text-destructive'
                            )}
                          >
                            {change > 0 ? '+' : ''}
                            {change}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-2.5">{round.area || '—'}</td>
                      <td className="px-4 py-2.5">{round.possession || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No prior auction rounds were found for this listing.
        </p>
      )}
    </div>
  )
}
