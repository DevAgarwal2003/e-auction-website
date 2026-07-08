import Container from '@/components/common/Container'
import PropertyCardSkeleton from '@/components/property/PropertyCardSkeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-brand-gradient py-10 md:py-14">
        <Container>
          <div className="h-9 w-72 rounded-lg bg-white/10" />
          <div className="mt-2 h-4 w-96 rounded bg-white/10" />
        </Container>
      </div>
      <Container className="py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="h-[520px] rounded-2xl border border-border/70 bg-card shadow-soft" />
          </aside>
          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
