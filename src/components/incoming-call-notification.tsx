'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Phone, Video, PhoneOff, X } from 'lucide-react'

interface IncomingCallInfo {
  id: string
  subject: string
  consultationType: string
  startedAt: string | null
  caller: {
    id: string
    firstName: string
    lastName: string
    avatarUrl?: string | null
    specialization?: string | null
  }
}

interface IncomingCallNotificationProps {
  call: IncomingCallInfo
  onAccept: (call: IncomingCallInfo) => void
  onReject: (call: IncomingCallInfo) => void
}

export function IncomingCallNotification({
  call,
  onAccept,
  onReject,
}: IncomingCallNotificationProps) {
  const isVideo = call.consultationType === 'VIDEO'
  const callerName = `${call.caller.firstName} ${call.caller.lastName}`
  const initials = `${call.caller.firstName.charAt(0)}${call.caller.lastName.charAt(0)}`.toUpperCase()

  const handleReject = React.useCallback(async () => {
    onReject(call)
  }, [call, onReject])

  return (
    <Card className="fixed top-4 right-4 z-[90] w-80 shadow-2xl border-0 bg-white/95 backdrop-blur-lg animate-in slide-in-from-top-4 duration-300">
      <div className="p-4">
        {/* Close button */}
        <div className="flex justify-end mb-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-foreground -mt-1 -mr-1"
            onClick={handleReject}
          >
            <X className="size-3.5" />
          </Button>
        </div>

        {/* Caller info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Avatar className="size-12 border-2 border-emerald-200">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Pulsing ring indicator */}
            <div className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-30" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-slate-900 truncate">
              {callerName}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {call.caller.specialization || 'Nurse'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isVideo ? (
                <Video className="size-3 text-emerald-600" />
              ) : (
                <Phone className="size-3 text-emerald-600" />
              )}
              <span className="text-xs text-emerald-600 font-medium">
                Incoming {isVideo ? 'Video' : 'Voice'} Call
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11 rounded-xl"
            onClick={() => onAccept(call)}
          >
            {isVideo ? <Video className="size-4" /> : <Phone className="size-4" />}
            Accept
          </Button>
          <Button
            variant="destructive"
            className="flex-1 gap-2 h-11 rounded-xl"
            onClick={handleReject}
          >
            <PhoneOff className="size-4" />
            Decline
          </Button>
        </div>
      </div>
    </Card>
  )
}
