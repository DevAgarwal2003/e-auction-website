import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Container from '@/components/common/Container'
import Reveal from '@/components/common/Reveal'
import { Button } from '@/components/ui/button'

export default function CtaBanner() {
  return (
    <section className="py-14 md:py-20">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#1f2c7a_0%,#2a3b9e_100%)] px-6 py-12 text-white md:px-14 md:py-16">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(245,179,1,0.3),transparent_70%)]" />
            <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h3 className="font-display text-2xl font-bold md:text-3xl text-balance">
                  Ready to find your next property?
                </h3>
                <p className="mt-2 max-w-xl text-white/80">
                  Join thousands of buyers and investors discovering verified bank auction deals
                  every day. Start exploring now — no charges to browse.
                </p>
              </div>
              <Button asChild variant="secondary" size="lg" className="shrink-0">
                <Link href="/auctions">
                  Browse Auctions
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
