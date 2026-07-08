import Link from 'next/link'
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone } from 'lucide-react'
import Logo from './Logo'
import Container from '@/components/common/Container'

const columns = [
  {
    title: 'Explore',
    links: [
      { label: 'Browse All Auctions', href: '/auctions' },
      { label: 'Residential', href: '/auctions?type=Residential' },
      { label: 'Commercial', href: '/auctions?type=Commercial' },
      { label: 'Industrial', href: '/auctions?type=Industrial' },
      { label: 'Agricultural', href: '/auctions?type=Agricultural' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'FAQs', href: '/#faq' },
      { label: 'Contact', href: '/about' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/about' },
      { label: 'Privacy Policy', href: '/about' },
      { label: 'Auction Rules', href: '/about' },
      { label: 'Disclaimer', href: '/about' },
    ],
  },
]

const socials = [Facebook, Twitter, Linkedin, Instagram]

export default function Footer() {
  return (
    <footer className="mt-auto bg-navy-900 text-white/75">
      <Container className="py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-12">
          <div className="col-span-2 md:col-span-4">
            <Logo light />
            <p className="mt-4 max-w-xs text-sm text-white/60">
              India&apos;s unified marketplace aggregating verified bank e-auction properties from
              leading banks and financial institutions — all in one place.
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map((Icon, i) => (
                <span
                  key={i}
                  className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-white/[0.06] text-white/70 transition-colors hover:bg-gold hover:text-gold-foreground"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <h4 className="mb-4 font-display font-bold text-white">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-white/60 transition-colors hover:text-gold"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-2">
            <h4 className="mb-4 font-display font-bold text-white">Get in Touch</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-sm">
                <Phone className="h-4 w-4 text-gold" />
                1800-123-4567
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <Mail className="h-4 w-4 text-gold" />
                support@bidacres.in
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} BidAcres. All rights reserved.
          </p>
          <p className="text-xs text-white/40">Sample data shown for demonstration purposes only.</p>
        </div>
      </Container>
    </footer>
  )
}
