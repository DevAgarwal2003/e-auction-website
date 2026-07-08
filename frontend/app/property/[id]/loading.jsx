import Container from '@/components/common/Container'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <Container className="py-10">
      <Skeleton className="mb-6 h-4 w-64" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Skeleton className="mb-4 h-[300px] w-full rounded-2xl md:h-[440px]" />
          <Skeleton className="mb-2 h-8 w-3/4" />
          <Skeleton className="mb-6 h-4 w-1/2" />
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    </Container>
  )
}
