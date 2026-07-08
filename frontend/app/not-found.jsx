import Link from 'next/link'
import { Home, Search } from 'lucide-react'
import Container from '@/components/common/Container'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-7xl font-extrabold text-navy-700/15 md:text-9xl">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold md:text-3xl">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you are looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auctions">
            <Search className="h-4 w-4" />
            Browse Auctions
          </Link>
        </Button>
      </div>
    </Container>
  )
}
