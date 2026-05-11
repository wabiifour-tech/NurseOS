'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full border-red-200">
        <CardContent className="p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
            <AlertTriangle className="size-7 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-6">
            An unexpected error occurred while loading this page. This might be a temporary issue.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={reset}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="size-4" />
              Try Again
            </Button>
            <Link href="/dashboard">
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Home className="size-4" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
