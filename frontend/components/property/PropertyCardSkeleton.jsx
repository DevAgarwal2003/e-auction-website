import { Skeleton } from '@/components/ui/skeleton'

export default function PropertyCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
      <Skeleton className="h-52 w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <div className="mt-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/5" />
        </div>
        <div className="my-3 h-px bg-border" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
