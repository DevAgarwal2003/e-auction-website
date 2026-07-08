'use client'

import { useEffect, useState } from 'react'
import { Building2, CalendarClock, IndianRupee, Layers } from 'lucide-react'
import Container from '@/components/common/Container'
import CountUp from '@/components/common/CountUp'
import { api } from '@/lib/api'
import { platformStats } from '@/data/stats'

const icons = [Building2, CalendarClock, IndianRupee, Layers]

function mapStats(s) {
  if (!s) return null
  const crore = s.totalValue ? Math.round(s.totalValue / 1_00_00_000) : null
  return [
    { label: 'Properties Listed', value: s.totalProperties || 0, suffix: '+' },
    { label: 'Upcoming Auctions', value: s.upcomingAuctions || 0, suffix: '' },
    { label: 'Value Auctioned (₹ Cr)', value: crore || 0, suffix: '' },
    { label: 'Asset Categories', value: s.byType?.length || 5, suffix: '' },
  ]
}

export default function StatsSection() {
  const [stats, setStats] = useState(platformStats)

  useEffect(() => {
    let active = true
    api
      .stats()
      .then((s) => {
        const mapped = mapStats(s)
        if (active && mapped) setStats(mapped)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="relative -mt-8 md:-mt-12">
      <Container>
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border/70 bg-white p-6 shadow-card md:grid-cols-4 md:gap-6 md:p-8">
          {stats.map((stat, i) => {
            const Icon = icons[i] || Building2
            return (
              <div key={stat.label} className="flex flex-col items-center text-center md:flex-row md:gap-4 md:text-left">
                <div className="mb-2 grid h-12 w-12 place-items-center rounded-xl bg-accent text-primary md:mb-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-display text-2xl font-extrabold text-navy-900 md:text-3xl">
                    <CountUp end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground md:text-sm">
                    {stat.label}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
