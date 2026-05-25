'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Phone, Copy, MessageSquare, Loader2, PhoneCall } from 'lucide-react'
import { toast } from 'sonner'

interface PhoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  consultationId: string
  consultantName: string
  consultantPhone: string | null
  token: string | null
}

export function PhoneDialog({
  open,
  onOpenChange,
  consultationId,
  consultantName,
  consultantPhone,
  token,
}: PhoneDialogProps) {
  const [callNotes, setCallNotes] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [notesSaved, setNotesSaved] = React.useState(false)

  const headers = React.useMemo(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) h['Authorization'] = `Bearer ${token}`
    return h
  }, [token])

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '')
    // Convert +234 to 234, or 0 to 234
    if (cleaned.startsWith('+')) cleaned = cleaned.substring(1)
    if (cleaned.startsWith('0')) cleaned = '234' + cleaned.substring(1)
    return cleaned
  }

  const handleCopyPhone = async () => {
    if (!consultantPhone) return
    try {
      await navigator.clipboard.writeText(consultantPhone)
      toast.success('Phone number copied to clipboard!')
    } catch {
      toast.error('Failed to copy phone number')
    }
  }

  const handleWhatsApp = () => {
    if (!consultantPhone) return
    const formatted = formatPhoneForWhatsApp(consultantPhone)
    window.open(`https://wa.me/${formatted}`, '_blank')
  }

  const handleSaveNotes = async () => {
    if (!callNotes.trim()) {
      toast.error('Please enter some call notes')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/caregrid/consultations/${consultationId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          notes: callNotes.trim(),
        }),
      })
      if (res.ok) {
        toast.success('Call notes saved successfully!')
        setNotesSaved(true)
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Failed to save call notes')
      }
    } catch {
      toast.error('Failed to save call notes')
    } finally {
      setSaving(false)
    }
  }

  React.useEffect(() => {
    if (open) {
      setCallNotes('')
      setNotesSaved(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="size-5 text-emerald-600" />
            Phone Consultation
          </DialogTitle>
          <DialogDescription>
            Connect with {consultantName} via phone
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Phone number display */}
          <div className="bg-slate-50 rounded-lg p-4 border">
            <p className="text-xs font-medium text-muted-foreground mb-1">{consultantName}&apos;s Phone Number</p>
            <p className="text-lg font-semibold text-slate-900 font-mono">
              {consultantPhone || 'No phone number available'}
            </p>
          </div>

          {/* Action buttons */}
          {consultantPhone && (
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                onClick={handleWhatsApp}
              >
                <MessageSquare className="size-4" />
                Call via WhatsApp
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleCopyPhone}
              >
                <Copy className="size-4" />
                Copy Number
              </Button>
            </div>
          )}

          {/* Direct call button */}
          {consultantPhone && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                window.open(`tel:${consultantPhone}`, '_self')
              }}
            >
              <PhoneCall className="size-4" />
              Call Directly
            </Button>
          )}

          {/* Call notes */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Log Call Notes</p>
            <Textarea
              value={callNotes}
              onChange={e => { setCallNotes(e.target.value); setNotesSaved(false) }}
              placeholder="Record key discussion points, recommendations, follow-up items..."
              rows={4}
              className="resize-none"
            />
          </div>

          {notesSaved && (
            <p className="text-xs text-emerald-600 font-medium">Notes saved successfully!</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            onClick={handleSaveNotes}
            disabled={saving || !callNotes.trim()}
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save Notes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
