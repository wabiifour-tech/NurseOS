'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)

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
            An unexpected error occurred while loading this page.
          </p>

          {/* Show actual error message + stack for debugging */}
          <div className="mb-6 text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
            >
              <Bug className="size-3" />
              {showDetails ? 'Hide' : 'Show'} error details
            </button>
            {showDetails && (
              <div className="mt-2 p-3 rounded-lg bg-muted/50 border text-left">
                <p className="text-xs font-mono text-red-600 dark:text-red-400 break-words">
                  {error?.message || 'Unknown error'}
                </p>
                {error?.digest && (
                  <p className="text-[10px] text-muted-foreground mt-1">Digest: {error.digest}</p>
                )}
                {error?.stack && (
                  <details className="mt-2">
                    <summary className="text-[10px] text-muted-foreground cursor-pointer">Stack trace</summary>
                    <pre className="text-[10px] text-muted-foreground mt-1 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={reset}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="size-4" />
              Try Again
            </Button>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Link href="/dashboard">
                <Home className="size-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
