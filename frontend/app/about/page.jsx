import { Network, ShieldCheck, Gavel, TrendingUp, Mail, Phone } from 'lucide-react'
import Container from '@/components/common/Container'
import SectionHeading from '@/components/common/SectionHeading'
import Reveal from '@/components/common/Reveal'

export const metadata = {
  title: 'About Us',
  description:
    'BidAcres is a unified bank e-auction property marketplace built to make distressed asset discovery simple, transparent and accessible for every buyer and investor in India.',
  alternates: { canonical: '/about' },
}

const values = [
  {
    icon: Network,
    title: 'One Unified Platform',
    desc: 'We aggregate auction listings from multiple banks into a single searchable marketplace.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified & Transparent',
    desc: 'Every listing is backed by bank-verified title documents and a transparent bidding process.',
  },
  {
    icon: Gavel,
    title: 'Fair Price Discovery',
    desc: 'Open e-auctions ensure assets are sold at fair market value through competitive bidding.',
  },
  {
    icon: TrendingUp,
    title: 'Smart Investments',
    desc: 'Discover high-value opportunities, often below market rates, across every asset class.',
  },
]

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-brand-gradient text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(245,179,1,0.25),transparent_70%)]" />
        <Container className="relative py-16 text-center md:py-24">
          <Reveal>
            <h1 className="font-display text-4xl font-extrabold md:text-5xl">About BidAcres</h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              BidAcres is a unified bank e-auction property marketplace built to make distressed
              asset discovery simple, transparent and accessible for every buyer and investor in
              India.
            </p>
          </Reveal>
        </Container>
      </section>

      <Container className="py-16 md:py-24">
        <div className="mb-20 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <Reveal direction="right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=70"
              alt="Modern buildings"
              className="w-full rounded-2xl shadow-lift"
            />
          </Reveal>
          <Reveal direction="left">
            <SectionHeading
              align="left"
              eyebrow="Our Mission"
              title="From search to sale, all in one place"
              className="mb-5"
            />
            <p className="leading-relaxed text-muted-foreground">
              Banks and financial institutions auction thousands of properties every year to recover
              Non-Performing Asset (NPA) loans. Historically these listings were scattered across
              dozens of individual portals, making discovery painful for buyers.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              BidAcres solves this by aggregating listings from across banks into one intelligent,
              easy-to-use platform — so you can search, compare, track and bid on opportunities from
              anywhere in the country, with complete confidence.
            </p>
          </Reveal>
        </div>

        <SectionHeading eyebrow="Why Choose Us" title="Built on Trust and Transparency" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition-shadow hover:shadow-card">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-xl bg-brand-soft text-gold">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold">{v.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border/70 bg-card p-6 shadow-soft md:p-10">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-display text-xl font-semibold">
                Have questions or partnership enquiries?
              </h3>
              <p className="mt-1 text-muted-foreground">
                Our team is available Monday to Saturday, 9 AM to 7 PM.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:support@bidacres.in"
                className="inline-flex items-center gap-2 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:bg-accent"
              >
                <Mail className="h-4 w-4 text-primary" />
                support@bidacres.in
              </a>
              <a
                href="tel:18001234567"
                className="inline-flex items-center gap-2 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:bg-accent"
              >
                <Phone className="h-4 w-4 text-primary" />
                1800-123-4567
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
