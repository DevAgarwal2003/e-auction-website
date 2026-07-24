export default function manifest() {
  return {
    name: 'BidAcres — Bank E-Auction Property Marketplace',
    short_name: 'BidAcres',
    description:
      "India's unified bank e-auction property marketplace for verified residential, commercial, industrial and agricultural properties.",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0d1440',
    lang: 'en-IN',
    categories: ['business', 'finance', 'shopping'],
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
