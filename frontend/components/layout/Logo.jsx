import { Gavel } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Logo({ light = false, compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft shadow-[0_6px_16px_rgba(31,44,122,0.35)]">
        <Gavel className="h-[22px] w-[22px] text-gold" />
      </div>
      {!compact && (
        <div className="leading-none">
          <span
            className={cn(
              'font-display text-xl font-extrabold tracking-tight',
              light ? 'text-white' : 'text-navy-900'
            )}
          >
            Bid<span className="text-gold">Acres</span>
          </span>
          <span
            className={cn(
              'mt-[-2px] block text-[0.62rem] font-semibold uppercase tracking-[0.14em]',
              light ? 'text-white/70' : 'text-muted-foreground'
            )}
          >
            Bank E-Auctions
          </span>
        </div>
      )}
    </div>
  )
}
