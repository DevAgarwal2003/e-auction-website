import { ShieldCheck, Gavel, Building2 } from 'lucide-react'
import Container from '@/components/common/Container'
import Reveal from '@/components/common/Reveal'
import SearchBar from './SearchBar'

const trustItems = [
  { icon: ShieldCheck, text: 'Bank-Verified Titles' },
  { icon: Gavel, text: 'Transparent Auctions' },
  { icon: Building2, text: 'Pan-India Listings' },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-gradient text-white">
      {/* Background image layer */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=60)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Glow accents */}
      <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(245,179,1,0.28),transparent_70%)]" />
      <div className="absolute -bottom-40 -left-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(59,82,196,0.4),transparent_70%)]" />

      <Container className="relative py-16 md:py-24">
        <div className="mx-auto mb-8 max-w-3xl text-center md:mb-10">
          <Reveal direction="down">
            <span className="mb-5 inline-flex items-center rounded-full border border-gold/30 bg-gold/15 px-4 py-1.5 text-sm font-semibold text-gold-light">
              India&apos;s Unified Bank E-Auction Marketplace
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl text-balance">
              Your search for the right{' '}
              <span className="gradient-text">property ends here</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/80 md:text-xl">
              Discover thousands of verified residential, commercial, industrial and agricultural
              properties auctioned by leading banks — aggregated on a single transparent platform.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {trustItems.map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-white/90">
                  <item.icon className="h-4 w-4 text-gold" />
                  <span className="text-sm font-semibold">{item.text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.3} amount={0}>
          <div className="mx-auto max-w-5xl">
            <SearchBar />
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
