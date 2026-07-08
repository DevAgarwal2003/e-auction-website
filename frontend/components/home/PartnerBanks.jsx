import Container from '@/components/common/Container'
import { partnerBanks } from '@/data/stats'

export default function PartnerBanks() {
  const row = [...partnerBanks, ...partnerBanks]
  return (
    <section className="border-y border-border/70 bg-white py-10">
      <Container>
        <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Listings aggregated from leading banks &amp; financial institutions
        </p>
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />
          <div className="flex w-max animate-marquee gap-10">
            {row.map((bank, i) => (
              <span
                key={i}
                className="whitespace-nowrap font-display text-lg font-bold text-navy-900/40 transition-colors hover:text-navy-700"
              >
                {bank}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
