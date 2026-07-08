import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'BidAcres | Bank E-Auction Property Marketplace',
    template: '%s | BidAcres',
  },
  description:
    "BidAcres is India's unified bank e-auction property marketplace. Discover verified residential, commercial, industrial and agricultural properties auctioned by leading banks — all in one transparent platform.",
  keywords: [
    'bank auction properties',
    'e-auction',
    'BAANKNET',
    'property auction India',
    'distressed assets',
    'NPA properties',
    'residential auction',
    'commercial auction',
  ],
  authors: [{ name: 'BidAcres' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'BidAcres',
    title: 'BidAcres | Bank E-Auction Property Marketplace',
    description:
      "India's unified bank e-auction property marketplace — search, compare and track verified bank auction properties across the country.",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BidAcres | Bank E-Auction Property Marketplace',
    description:
      "India's unified bank e-auction property marketplace — verified listings from leading banks.",
  },
  icons: { icon: '/favicon.svg' },
  robots: { index: true, follow: true },
}

export const viewport = {
  themeColor: '#0d1440',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
