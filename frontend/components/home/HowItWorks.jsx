import { Search, UserCheck, Wallet, Trophy } from 'lucide-react'
import Container from '@/components/common/Container'
import SectionHeading from '@/components/common/SectionHeading'
import Reveal from '@/components/common/Reveal'

const steps = [
  {
    icon: Search,
    title: 'Search & Discover',
    desc: 'Filter thousands of aggregated listings by state, city, locality, property type and budget.',
  },
  {
    icon: UserCheck,
    title: 'Register & Verify',
    desc: 'Complete a quick KYC and register as a verified bidder for the auctions you are interested in.',
  },
  {
    icon: Wallet,
    title: 'Deposit EMD',
    desc: 'Pay the Earnest Money Deposit securely online to become eligible to place bids.',
  },
  {
    icon: Trophy,
    title: 'Bid & Win',
    desc: 'Place competitive bids in real time and secure your property at a transparent, fair price.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Simple Process"
          title="How BidAcres Works"
          subtitle="From search to sale in four straightforward steps."
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.08}>
              <div className="relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition-shadow hover:shadow-card">
                <span className="absolute right-5 top-3 font-display text-5xl font-extrabold text-navy-700/[0.07]">
                  0{i + 1}
                </span>
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-gold">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
