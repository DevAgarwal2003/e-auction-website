'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, SearchX, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import Container from '@/components/common/Container'
import PropertyFilters from '@/components/property/PropertyFilters'
import PropertyCard from '@/components/property/PropertyCard'
import PropertyCardSkeleton from '@/components/property/PropertyCardSkeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { budgetRanges } from '@/data/locations'
import { localQuery } from '@/data/localFilter'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const PER_PAGE = 9
const FILTER_KEYS = ['keyword', 'state', 'city', 'locality', 'type', 'budget', 'bank', 'status']
const emptyFilters = Object.fromEntries(FILTER_KEYS.map((k) => [k, '']))

function buildPages(current, total) {
  const pages = []
  const add = (p) => pages.push(p)
  const window = 1
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= current - window && p <= current + window)) {
      add(p)
    } else if (pages[pages.length - 1] !== '…') {
      add('…')
    }
  }
  return pages
}

export default function ListingsView() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState(() => {
    const seed = { ...emptyFilters }
    for (const k of FILTER_KEYS) seed[k] = searchParams.get(k) || ''
    return seed
  })
  const [sort, setSort] = useState(() => searchParams.get('sort') || 'relevance')
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1)

  const [data, setData] = useState({ results: [], total: 0, pageCount: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [offline, setOffline] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const firstRun = useRef(true)

  // Reset to page 1 when filters or sort change (but not on initial mount).
  useEffect(() => {
    if (firstRun.current) return
    setPage(1)
  }, [filters, sort])

  // Keep the URL in sync with the current state (shareable links).
  useEffect(() => {
    const params = new URLSearchParams()
    for (const k of FILTER_KEYS) if (filters[k]) params.set(k, filters[k])
    if (sort && sort !== 'relevance') params.set('sort', sort)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    router.replace(qs ? `/auctions?${qs}` : '/auctions', { scroll: false })
  }, [filters, sort, page, router])

  // Fetch with client cache: instant cached page, background refresh; debounce keyword.
  useEffect(() => {
    let active = true
    const params = { ...filters, sort, page, limit: PER_PAGE }
    const cached = api.peekList(params)

    if (cached) {
      setData(cached)
      setLoading(false)
      setRefreshing(true)
    } else {
      setLoading(true)
      setRefreshing(false)
    }

    const debounceMs = filters.keyword ? 300 : 0
    const handle = setTimeout(async () => {
      try {
        const res = await api.listProperties(params, { bypassCache: Boolean(cached) })
        if (!active) return
        setData(res)
        setOffline(false)
      } catch {
        if (!active) return
        setData(localQuery(filters, sort, page, PER_PAGE))
        setOffline(true)
      } finally {
        if (active) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }, debounceMs)

    firstRun.current = false
    return () => {
      active = false
      clearTimeout(handle)
    }
  }, [filters, sort, page])

  const activeChips = useMemo(
    () =>
      Object.entries(filters)
        .filter(([, v]) => v !== '')
        .map(([key, v]) => ({
          key,
          label: key === 'budget' ? budgetRanges[Number(v)]?.label : v,
        })),
    [filters]
  )

  const handleReset = () => setFilters(emptyFilters)
  const pageItems = data.results || []
  const pageCount = data.pageCount || 0

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="relative overflow-hidden bg-brand-gradient text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(245,179,1,0.25),transparent_70%)]" />
        <Container className="relative py-10 md:py-14">
          <h1 className="font-display text-3xl font-extrabold md:text-4xl">Browse Auction Properties</h1>
          <p className="mt-1.5 text-white/80">Explore verified bank e-auction listings across India.</p>
        </Container>
      </div>

      <Container className="py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Desktop sidebar */}
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-24">
              <PropertyFilters filters={filters} setFilters={setFilters} onReset={handleReset} />
            </div>
          </aside>

          {/* Results */}
          <div className="lg:col-span-9">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                <span className="font-display text-lg font-extrabold text-foreground">
                  {data.total.toLocaleString('en-IN')}
                </span>{' '}
                properties found
                {refreshing && <span className="ml-2 text-xs text-muted-foreground">updating…</span>}
              </p>
              <div className="flex items-center gap-2.5">
                {/* Mobile filter trigger */}
                <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[320px] overflow-y-auto p-0">
                    <SheetHeader className="border-b border-border px-5 py-4">
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="p-4">
                      <PropertyFilters filters={filters} setFilters={setFilters} onReset={handleReset} />
                      <SheetClose asChild>
                        <Button className="mt-4 w-full">
                          Show {data.total.toLocaleString('en-IN')} Results
                        </Button>
                      </SheetClose>
                    </div>
                  </SheetContent>
                </Sheet>

                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-9 w-[190px] bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Sort: Recommended</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="date">Auction Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeChips.length > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => setFilters((p) => ({ ...p, [chip.key]: '' }))}
                    className="inline-flex items-center gap-1.5 rounded-full border border-navy-200 bg-white px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-accent"
                  >
                    {chip.label}
                    <span className="text-muted-foreground">×</span>
                  </button>
                ))}
                <button
                  onClick={handleReset}
                  className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold-dark transition-colors hover:bg-gold/25"
                >
                  Clear all
                </button>
              </div>
            )}

            {offline && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-navy-200 bg-navy-50 p-4 text-sm text-primary">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Showing sample data — the backend API is not reachable. Start the backend and
                  populate the database to see live BAANKNET listings.
                </span>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: PER_PAGE }).map((_, i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            ) : pageItems.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {pageItems.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {pageCount > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page <= 1}
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1))
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {buildPages(page, pageCount).map((p, i) =>
                      p === '…' ? (
                        <span key={`e${i}`} className="px-2 text-muted-foreground">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => {
                            setPage(p)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className={cn(
                            'h-10 min-w-10 rounded-lg px-3 text-sm font-semibold transition-colors',
                            p === page
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-input bg-white text-foreground hover:bg-accent'
                          )}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page >= pageCount}
                      onClick={() => {
                        setPage((p) => Math.min(pageCount, p + 1))
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                <SearchX className="mx-auto mb-3 h-14 w-14 text-muted-foreground" />
                <h3 className="font-display text-lg font-semibold">No properties match your filters</h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  Try adjusting or clearing some of the filters to see more results.
                </p>
                <Button className="mt-4" onClick={handleReset}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}
