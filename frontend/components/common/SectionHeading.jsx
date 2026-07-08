import { cn } from '@/lib/utils'

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
}) {
  const centered = align === 'center'
  return (
    <div
      className={cn(
        'mb-10',
        centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl text-left',
        className
      )}
    >
      {eyebrow && (
        <span className="mb-3 inline-flex items-center rounded-full bg-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold-dark">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl text-balance">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-base text-muted-foreground md:text-lg">{subtitle}</p>}
    </div>
  )
}
