const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default function sitemap() {
  const now = new Date()
  const routes = ['', '/auctions', '/about']
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '/auctions' ? 'hourly' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))
}
