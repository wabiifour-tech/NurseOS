'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  SwitchCamera,
  Volume2,
  VolumeX,
  Loader2,
  PhoneIncoming,
  Shield,
} from 'lucide-react'
import { useWebRTC, type CallInfo, type CallState } from '@/hooks/use-webrtc'

interface VideoCallProps {
  callInfo: CallInfo
  token: string | null
  onCallEnded: () => void
}

export function VideoCall({ callInfo, token, onCallEnded }: VideoCallProps) {
  const {
    localVideoRef,
    remoteVideoRef,
    callState,
    micOn,
    cameraOn,
    callDuration,
    error,
    formatDuration,
    startAsCaller,
    startAsCallee,
    toggleMic,
    toggleCamera,
    switchCamera,
    endCall,
  } = useWebRTC({
    consultationId: callInfo.consultationId,
    isRequester: callInfo.isRequester,
    token,
    callType: callInfo.callType,
    onCallEnded,
  })

  const isVideo = callInfo.callType === 'VIDEO'
  const participantName = `${callInfo.participant.firstName} ${callInfo.participant.lastName}`
  const initials = `${callInfo.participant.firstName.charAt(0)}${callInfo.participant.lastName.charAt(0)}`.toUpperCase()

  // Auto-start call when component mounts
  React.useEffect(() => {
    if (callState === 'idle') {
      if (callInfo.isRequester) {
        startAsCaller()
      } else {
        startAsCallee()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEndCall = React.useCallback(() => {
    endCall()
    onCallEnded()
  }, [endCall, onCallEnded])

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Remote Video — full screen */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay when no remote video */}
      {callState !== 'connected' && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-[1]" />
      )}

      {/* Top bar — participant info */}
      <div className="absolute top-0 left-0 right-0 z-[10] p-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(callState === 'ringing' || callState === 'connecting') && (
              <Avatar className="size-12 border-2 border-white/30">
                <AvatarFallback className="bg-emerald-600 text-white text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <h2 className="text-white font-semibold text-lg">
                {participantName}
              </h2>
              <CallStatusText
                callState={callState}
                callDuration={callDuration}
                formatDuration={formatDuration}
                callType={callInfo.callType}
              />
            </div>
          </div>

          {/* HIPAA notice */}
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <Shield className="size-3.5 text-emerald-400" />
            <span className="text-[11px] text-white/80 font-medium">Not Recorded</span>
          </div>
        </div>
      </div>

      {/* Center content — ringing/connecting state */}
      {(callState === 'ringing' || callState === 'connecting') && (
        <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center">
          <Avatar className="size-24 border-4 border-white/20 mb-4">
            <AvatarFallback className="bg-emerald-600 text-white text-3xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-white text-2xl font-semibold mb-1">{participantName}</h2>
          <p className="text-white/60 text-sm mb-1">
            {callInfo.participant.specialization || 'Nurse'}
          </p>
          <p className="text-emerald-400 text-sm font-medium animate-pulse">
            {callState === 'connecting'
              ? 'Connecting...'
              : callInfo.isRequester
                ? 'Ringing...'
                : 'Incoming call'}
          </p>

          {/* Animated ring effect */}
          <div className="relative mt-8">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ width: 80, height: 80, margin: 'auto' }} />
            <div className="relative flex items-center justify-center">
              <PhoneIncoming className="size-10 text-emerald-400" />
            </div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center">
          <div className="bg-red-500/20 backdrop-blur-md rounded-2xl p-6 max-w-sm mx-4 text-center">
            <p className="text-red-200 text-sm font-medium">{error}</p>
            <Button
              variant="outline"
              className="mt-4 text-white border-white/30 hover:bg-white/10"
              onClick={handleEndCall}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Local Video — picture-in-picture */}
      {isVideo && (
        <div className="absolute bottom-28 right-4 z-[10] group">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-36 h-48 sm:w-44 sm:h-60 rounded-2xl object-cover border-2 border-white/20 shadow-2xl transition-transform group-hover:scale-105"
            style={{ transform: 'scaleX(-1)' }} // Mirror local video
          />
          {!cameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 rounded-2xl">
              <VideoOff className="size-8 text-white/50" />
            </div>
          )}
        </div>
      )}

      {/* Voice call — audio visualization when connected */}
      {!isVideo && callState === 'connected' && (
        <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center">
          <Avatar className="size-32 border-4 border-emerald-500/30 mb-6">
            <AvatarFallback className="bg-emerald-600 text-white text-4xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-white text-3xl font-semibold mb-2">{participantName}</h2>
          <p className="text-white/60 text-base mb-4">
            {callInfo.participant.specialization || 'Nurse'}
          </p>
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-emerald-400 rounded-full animate-pulse"
                  style={{
                    height: `${12 + Math.random() * 20}px`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: '0.8s',
                  }}
                />
              ))}
            </div>
            <span className="text-sm font-mono">{formatDuration(callDuration)}</span>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-[10] pb-8 pt-4">
        {/* Duration display when connected */}
        {callState === 'connected' && isVideo && (
          <div className="flex justify-center mb-4">
            <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-1.5">
              <span className="text-white text-sm font-mono">{formatDuration(callDuration)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          {/* Mic toggle */}
          <Button
            size="icon"
            className={`rounded-full size-14 shadow-lg transition-all ${
              micOn
                ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            onClick={toggleMic}
          >
            {micOn ? <Mic className="size-6" /> : <MicOff className="size-6" />}
          </Button>

          {/* Camera toggle (video calls only) */}
          {isVideo && (
            <Button
              size="icon"
              className={`rounded-full size-14 shadow-lg transition-all ${
                cameraOn
                  ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              onClick={toggleCamera}
            >
              {cameraOn ? <Video className="size-6" /> : <VideoOff className="size-6" />}
            </Button>
          )}

          {/* Switch camera (video calls only, mobile) */}
          {isVideo && (
            <Button
              size="icon"
              className="rounded-full size-14 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white shadow-lg transition-all"
              onClick={switchCamera}
            >
              <SwitchCamera className="size-6" />
            </Button>
          )}

          {/* End call */}
          <Button
            size="icon"
            className="rounded-full size-16 bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all hover:scale-105"
            onClick={handleEndCall}
          >
            <PhoneOff className="size-7" />
          </Button>

          {/* Speaker toggle (voice calls only) */}
          {!isVideo && (
            <Button
              size="icon"
              className="rounded-full size-14 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white shadow-lg transition-all"
              onClick={() => {
                // Toggle speaker — this is a simplified implementation
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.volume = remoteVideoRef.current.volume === 0 ? 1 : 0
                }
              }}
            >
              <Volume2 className="size-6" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- Sub-components ----------

function CallStatusText({
  callState,
  callDuration,
  formatDuration,
  callType,
}: {
  callState: CallState
  callDuration: number
  formatDuration: (s: number) => string
  callType: string
}) {
  const typeLabel = callType === 'VIDEO' ? 'Video Call' : 'Voice Call'

  switch (callState) {
    case 'connecting':
      return <p className="text-white/60 text-sm">Connecting...</p>
    case 'ringing':
      return <p className="text-emerald-400 text-sm font-medium animate-pulse">Ringing...</p>
    case 'connected':
      return (
        <p className="text-emerald-400 text-sm font-medium">
          {formatDuration(callDuration)} · {typeLabel}
        </p>
      )
    case 'ended':
      return <p className="text-white/60 text-sm">Call ended</p>
    default:
      return <p className="text-white/60 text-sm">{typeLabel}</p>
  }
}
