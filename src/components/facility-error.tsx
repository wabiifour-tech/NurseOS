'use client'

import { AlertTriangle, Building2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FacilityErrorProps {
  title?: string
  message?: string
  onRetry?: () => void
}

/**
 * Shared error state component for pages that require a facility assignment.
 * Detects 403 status (no facility) and shows a helpful message instead of a generic retry.
 */
export function FacilityError({
  title = 'Unable to Load Data',
  message = 'This page requires a facility assignment. Please contact your administrator or select a facility in Settings.',
  onRetry,
}: FacilityErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-3 rounded-full bg-amber-50 mb-3">
        <Building2 className="size-6 text-amber-600" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="gap-2" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      )}
    </div>
  )
}
