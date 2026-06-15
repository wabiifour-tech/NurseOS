'use client'

import * as React from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { VideoCall } from '@/components/video-call'
import { IncomingCallNotification } from '@/components/incoming-call-notification'
import type { CallInfo, CallParticipant } from '@/hooks/use-webrtc'

// ========== Types ==========

interface IncomingCallData {
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

interface CallProviderState {
  activeCall: CallInfo | null
  incomingCalls: IncomingCallData[]
  isCallActive: boolean
  initiateCall: (consultingNurseId: string, callType: 'VIDEO' | 'PHONE', participant: CallParticipant, subject?: string) => Promise<void>
  acceptCall: (call: IncomingCallData) => void
  rejectCall: (call: IncomingCallData) => Promise<void>
  endActiveCall: () => void
}

const CallContext = React.createContext<CallProviderState | null>(null)

export function useCallProvider() {
  const ctx = React.useContext(CallContext)
  if (!ctx) {
    throw new Error('useCallProvider must be used within a CallProvider')
  }
  return ctx
}

// ========== Provider ==========

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  const [activeCall, setActiveCall] = React.useState<CallInfo | null>(null)
  const [incomingCalls, setIncomingCalls] = React.useState<IncomingCallData[]>([])
  const [dismissedCalls, setDismissedCalls] = React.useState<Set<string>>(new Set())

  // Poll for incoming calls every 5 seconds
  React.useEffect(() => {
    if (!token) return

    const pollIncoming = async () => {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch('/api/calls/incoming', { headers })
        if (!res.ok) return
        const data = await res.json()
        const calls: IncomingCallData[] = data.incomingCalls || []

        // Filter out dismissed calls
        const activeIncoming = calls.filter(c => !dismissedCalls.has(c.id))
        setIncomingCalls(activeIncoming)
      } catch {
        // Silent fail — polling should be resilient
      }
    }

    pollIncoming()
    const interval = setInterval(pollIncoming, 5000)
    return () => clearInterval(interval)
  }, [token, dismissedCalls])

  // Initiate a new call
  const initiateCall = React.useCallback(async (
    consultingNurseId: string,
    callType: 'VIDEO' | 'PHONE',
    participant: CallParticipant,
    subject?: string,
  ) => {
    if (!token) return

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          consultingNurseId,
          callType,
          subject: subject || `${callType === 'VIDEO' ? 'Video' : 'Voice'} Call`,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to initiate call')
      }

      const data = await res.json()
      const consultation = data.consultation

      setActiveCall({
        consultationId: consultation.id,
        callType,
        isRequester: true,
        participant,
        subject,
      })
    } catch (err) {
      console.error('Failed to initiate call:', err)
      throw err
    }
  }, [token])

  // Accept an incoming call
  const acceptCall = React.useCallback((call: IncomingCallData) => {
    // Remove from incoming list
    setIncomingCalls(prev => prev.filter(c => c.id !== call.id))
    setDismissedCalls(prev => new Set(prev).add(call.id))

    // Set as active call (as callee)
    setActiveCall({
      consultationId: call.id,
      callType: call.consultationType as 'VIDEO' | 'PHONE',
      isRequester: false,
      participant: {
        id: call.caller.id,
        firstName: call.caller.firstName,
        lastName: call.caller.lastName,
        avatarUrl: call.caller.avatarUrl,
        specialization: call.caller.specialization,
      },
      subject: call.subject,
    })
  }, [])

  // Reject an incoming call
  const rejectCall = React.useCallback(async (call: IncomingCallData) => {
    // Remove from incoming list
    setIncomingCalls(prev => prev.filter(c => c.id !== call.id))
    setDismissedCalls(prev => new Set(prev).add(call.id))

    // End the call on the server
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      await fetch('/api/calls/end', {
        method: 'POST',
        headers,
        body: JSON.stringify({ consultationId: call.id }),
      })
    } catch {
      // Silent fail
    }
  }, [token])

  // End the active call
  const endActiveCall = React.useCallback(() => {
    setActiveCall(null)
  }, [])

  const value: CallProviderState = {
    activeCall,
    incomingCalls,
    isCallActive: !!activeCall,
    initiateCall,
    acceptCall,
    rejectCall,
    endActiveCall,
  }

  return (
    <CallContext.Provider value={value}>
      {children}

      {/* Incoming call notifications */}
      {incomingCalls.length > 0 && !activeCall && (
        <div className="fixed top-4 right-4 z-[90] space-y-3">
          {incomingCalls.map(call => (
            <IncomingCallNotification
              key={call.id}
              call={call}
              onAccept={acceptCall}
              onReject={rejectCall}
            />
          ))}
        </div>
      )}

      {/* Active call overlay */}
      {activeCall && (
        <VideoCall
          callInfo={activeCall}
          token={token}
          onCallEnded={endActiveCall}
        />
      )}
    </CallContext.Provider>
  )
}
