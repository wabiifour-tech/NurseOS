import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
            <FileQuestion className="size-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Page Not Found</h2>
          <p className="text-sm text-muted-foreground mb-1">
            404 — The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Check the URL or navigate back to the dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Link href="/dashboard">
                <Home className="size-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/help">
                <ArrowLeft className="size-4" />
                Help & Support
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
