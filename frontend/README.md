# BidAcres — Frontend (Next.js)

A professional, SEO-friendly marketing + listings frontend for the BidAcres bank
e-auction property marketplace. Built with **Next.js (App Router)**, **Tailwind CSS**,
**shadcn/ui** primitives and **Framer Motion** animations.

## Tech stack

- **Next.js 14** (App Router, JavaScript)
- **Tailwind CSS** + CSS variables design tokens (navy + gold brand)
- **shadcn/ui** style component primitives (Radix UI under the hood)
- **Framer Motion** for scroll-triggered entrance animations
- **lucide-react** icons
- `next/font` (Inter + Poppins)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Build & run production:

```bash
npm run build
npm run start
```

## Environment variables

Create a `.env` (see `.env.example`):

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the e-auction backend REST API | `http://localhost:4000` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (used for SEO metadata, sitemap, OG) | `http://localhost:3000` |

If the backend is unreachable, the UI gracefully falls back to bundled sample data.

## Project structure

```
app/                     App Router routes
  layout.jsx             Root layout: fonts, SEO metadata, Navbar/Footer
  page.jsx               Home page (Hero, Stats, Categories, Featured, FAQ, CTA)
  auctions/              Listings page (filters, grid, pagination, URL sync)
  property/[id]/         Property detail page (+ dynamic SEO metadata)
  about/                 About page
  not-found.jsx          404 page
  sitemap.js, robots.js  SEO
components/
  ui/                    shadcn/ui primitives (button, card, select, sheet, …)
  layout/                Navbar, Footer, Logo
  home/                  Home page sections
  property/              Property card, filters, image, status badge, history
  common/                Container, SectionHeading, Reveal (animation), CountUp
lib/                     api client, cache, formatters, cn()
data/                    sample fallback data (properties, locations, stats)
hooks/                   useFilterMeta
```

## Backend API consumed

- `GET /api/properties` — list (filters, sort, pagination)
- `GET /api/properties/:id` — detail + similar
- `GET /api/meta/filters` — filter dropdown options
- `GET /api/meta/stats` — homepage headline stats
