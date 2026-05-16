'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface VideoCallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  consultationId: string
  consultationType: string
  isRequester: boolean
  otherPartyName: string
  token: string | null
}

export function VideoCallDialog({
  open,
  onOpenChange,
  consultationId,
  isRequester,
  otherPartyName,
  token,
}: VideoCallDialogProps) {
  const localVideoRef = React.useRef<HTMLVideoElement>(null)
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null)
  const peerConnectionRef = React.useRef<RTCPeerConnection | null>(null)
  const pollIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const [connecting, setConnecting] = React.useState(false)
  const [inCall, setInCall] = React.useState(false)
  const [waitingForPeer, setWaitingForPeer] = React.useState(false)
  const [micOn, setMicOn] = React.useState(true)
  const [cameraOn, setCameraOn] = React.useState(true)
  const [callDuration, setCallDuration] = React.useState(0)
  const durationRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const localStreamRef = React.useRef<MediaStream | null>(null)

  const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  }

  const headers = React.useMemo(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) h['Authorization'] = `Bearer ${token}`
    return h
  }, [token])

  const sendSignal = React.useCallback(async (type: string, data: Record<string, unknown>) => {
    await fetch(`/api/caregrid/consultations/${consultationId}/webrtc-signal`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ type, ...data }),
    })
  }, [consultationId, headers])

  const pollSignal = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/caregrid/consultations/${consultationId}/webrtc-signal`, { headers })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }, [consultationId, headers])

  const setupPeerConnection = React.useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnectionRef.current = pc

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateType = isRequester ? 'offer-candidate' : 'answer-candidate'
        sendSignal(candidateType, { candidate: JSON.stringify(event.candidate) })
      }
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setInCall(true)
        setConnecting(false)
        setWaitingForPeer(false)
        durationRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1)
        }, 1000)
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall()
      }
    }

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    return pc
  }, [isRequester, sendSignal])

  const startAsRequester = React.useCallback(async () => {
    setConnecting(true)
    try {
      const pc = setupPeerConnection()
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      await sendSignal('offer', { sdp: JSON.stringify(offer) })

      setWaitingForPeer(true)

      // Poll for answer
      pollIntervalRef.current = setInterval(async () => {
        const signal = await pollSignal()
        if (!signal) return

        if (signal.answer && pc.signalingState === 'have-local-offer') {
          const answer = JSON.parse(signal.answer)
          await pc.setRemoteDescription(new RTCSessionDescription(answer))

          // Add answer ICE candidates
          if (signal.answerCandidates?.length > 0) {
            for (const cand of signal.answerCandidates) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(cand)))
              } catch { /* ignore */ }
            }
          }

          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        }
      }, 2000)
    } catch (err) {
      console.error('Error starting call:', err)
      toast.error('Failed to start video call')
      setConnecting(false)
      setWaitingForPeer(false)
    }
  }, [setupPeerConnection, sendSignal, pollSignal])

  const startAsConsultant = React.useCallback(async () => {
    setConnecting(true)
    try {
      const signal = await pollSignal()
      if (!signal?.offer) {
        setWaitingForPeer(true)
        // Poll until offer appears
        pollIntervalRef.current = setInterval(async () => {
          const sig = await pollSignal()
          if (sig?.offer) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            await answerOffer(sig)
          }
        }, 2000)
        setConnecting(false)
        return
      }
      await answerOffer(signal)
    } catch (err) {
      console.error('Error joining call:', err)
      toast.error('Failed to join video call')
      setConnecting(false)
    }
  }, [pollSignal])

  const answerOffer = React.useCallback(async (signal: { offer: string; offerCandidates?: string[] }) => {
    setConnecting(true)
    setWaitingForPeer(false)
    try {
      const pc = setupPeerConnection()
      const offer = JSON.parse(signal.offer)
      await pc.setRemoteDescription(new RTCSessionDescription(offer))

      // Add offer ICE candidates
      if (signal.offerCandidates?.length > 0) {
        for (const cand of signal.offerCandidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(cand)))
          } catch { /* ignore */ }
        }
      }

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await sendSignal('answer', { sdp: JSON.stringify(answer) })
    } catch (err) {
      console.error('Error answering call:', err)
      toast.error('Failed to answer video call')
      setConnecting(false)
    }
  }, [setupPeerConnection, sendSignal])

  const startCall = React.useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      if (isRequester) {
        await startAsRequester()
      } else {
        await startAsConsultant()
      }
    } catch (err) {
      console.error('Error accessing media devices:', err)
      toast.error('Could not access camera/microphone. Please check permissions.')
      setConnecting(false)
    }
  }, [isRequester, startAsRequester, startAsConsultant])

  const endCall = React.useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    if (durationRef.current) clearInterval(durationRef.current)

    setInCall(false)
    setConnecting(false)
    setWaitingForPeer(false)
    setCallDuration(0)
  }, [])

  const toggleMic = React.useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setMicOn(prev => !prev)
    }
  }, [])

  const toggleCamera = React.useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setCameraOn(prev => !prev)
    }
  }, [])

  const handleClose = React.useCallback(() => {
    endCall()
    onOpenChange(false)
  }, [endCall, onOpenChange])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[640px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Video className="size-5 text-emerald-600" />
            Video Consultation
          </DialogTitle>
          <DialogDescription>
            {inCall ? `In call with ${otherPartyName}` : `Connecting to ${otherPartyName}...`}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 pt-0">
          {/* Video area */}
          <div className="relative bg-slate-900 rounded-lg overflow-hidden aspect-video">
            {/* Remote video (full size) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Local video (picture-in-picture) */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-3 right-3 w-32 h-24 rounded-lg border-2 border-white/30 object-cover z-10 bg-slate-800"
            />

            {/* Overlays */}
            {waitingForPeer && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-20">
                <Loader2 className="size-10 text-emerald-400 animate-spin mb-3" />
                <p className="text-white text-sm font-medium">Waiting for {otherPartyName} to join...</p>
                <p className="text-slate-400 text-xs mt-1">Share this consultation link with the other participant</p>
              </div>
            )}

            {connecting && !waitingForPeer && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-20">
                <Loader2 className="size-10 text-emerald-400 animate-spin mb-3" />
                <p className="text-white text-sm font-medium">Connecting...</p>
              </div>
            )}

            {!inCall && !connecting && !waitingForPeer && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-20">
                <Video className="size-12 text-emerald-400 mb-3" />
                <p className="text-white text-sm font-medium">Ready to start video call</p>
              </div>
            )}

            {/* Duration */}
            {inCall && (
              <div className="absolute top-3 left-3 bg-black/60 rounded-lg px-3 py-1 z-20">
                <span className="text-white text-sm font-mono">{formatDuration(callDuration)}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {!inCall && !connecting && !waitingForPeer ? (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                onClick={startCall}
              >
                <Video className="size-4" />
                Start Video Call
              </Button>
            ) : (
              <>
                <Button
                  size="icon"
                  variant={micOn ? 'default' : 'destructive'}
                  className="rounded-full size-12"
                  onClick={toggleMic}
                  disabled={!inCall}
                >
                  {micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
                </Button>
                <Button
                  size="icon"
                  variant={cameraOn ? 'default' : 'destructive'}
                  className="rounded-full size-12"
                  onClick={toggleCamera}
                  disabled={!inCall}
                >
                  {cameraOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="rounded-full size-12"
                  onClick={handleClose}
                >
                  <PhoneOff className="size-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
