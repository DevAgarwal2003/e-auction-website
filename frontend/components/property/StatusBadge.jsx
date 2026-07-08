import { cn } from '@/lib/utils'

const config = {
  Live: { dot: 'bg-success', text: 'text-success', bg: 'bg-success/12', label: 'Live Now', pulse: true },
  Upcoming: { dot: 'bg-navy-600', text: 'text-navy-700', bg: 'bg-navy-600/10', label: 'Upcoming' },
  Closed: { dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-400/15', label: 'Closed' },
}

export default function StatusBadge({ status, className }) {
  const c = config[status] || config.Upcoming
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
        c.bg,
        c.text,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {c.pulse && (
          <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', c.dot)} />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', c.dot)} />
      </span>
      {c.label}
    </span>
  )
}
