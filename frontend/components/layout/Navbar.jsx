'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, ChevronRight } from 'lucide-react'
import Logo from './Logo'
import Container from '@/components/common/Container'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'All Auctions', href: '/auctions' },
  { label: 'Residential', href: '/auctions?type=Residential' },
  { label: 'Commercial', href: '/auctions?type=Commercial' },
  { label: 'About', href: '/about' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (href) => {
    const base = href.split('?')[0]
    if (base === '/') return pathname === '/'
    return pathname === base
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-all duration-300',
        scrolled
          ? 'border-border/70 bg-white/85 shadow-soft backdrop-blur-md'
          : 'border-transparent bg-white/70 backdrop-blur'
      )}
    >
      <Container className="flex h-16 items-center justify-between md:h-[72px]">
        <Link href="/" aria-label="BidAcres home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                'relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors',
                isActive(link.href)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute inset-x-3.5 -bottom-[1px] h-0.5 rounded-full bg-gold" />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href="/auctions">Browse Auctions</Link>
          </Button>
        </div>

        {/* Mobile */}
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0">
              <div className="border-b border-border px-5 py-4">
                <Logo />
              </div>
              <nav className="flex flex-col p-3">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.label}>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                    >
                      {link.label}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-2 flex flex-col gap-2 px-5">
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
                <SheetClose asChild>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href="/auctions">Browse Auctions</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  )
}
