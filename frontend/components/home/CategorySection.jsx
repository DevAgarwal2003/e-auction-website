import Link from 'next/link'
import { Home, Store, Factory, Sprout, Car, ArrowRight } from 'lucide-react'
import Container from '@/components/common/Container'
import SectionHeading from '@/components/common/SectionHeading'
import Reveal from '@/components/common/Reveal'
import { categoryStats } from '@/data/stats'

const iconMap = {
  Residential: Home,
  Commercial: Store,
  Industrial: Factory,
  Agricultural: Sprout,
  Vehicle: Car,
}

export default function CategorySection() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Browse by Category"
          title="Explore Properties Across Asset Types"
          subtitle="From city apartments to industrial estates — find the right opportunity in every category."
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categoryStats.map((cat, i) => {
            const Icon = iconMap[cat.type] || Home
            return (
              <Reveal key={cat.type} delay={i * 0.06}>
                <Link
                  href={`/auctions?type=${cat.type}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-gold hover:shadow-lift"
                >
                  <div className="mb-3 grid h-14 w-14 place-items-center rounded-xl bg-accent text-primary transition-colors group-hover:bg-gold group-hover:text-gold-foreground">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{cat.type}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {cat.count.toLocaleString('en-IN')} properties
                  </p>
                  <ArrowRight className="absolute bottom-5 right-5 h-5 w-5 -translate-x-2 text-gold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
