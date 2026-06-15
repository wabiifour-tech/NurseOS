'use client'

import { useRef, useCallback, useEffect, useState } from 'react'

// ========== Types ==========

export type CallState = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended'

export interface CallParticipant {
  id: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
  specialization?: string | null
}

export interface CallInfo {
  consultationId: string
  callType: 'VIDEO' | 'PHONE'
  isRequester: boolean
  participant: CallParticipant
  subject?: string
}

interface UseWebRTCOptions {
  consultationId: string
  isRequester: boolean
  token: string | null
  callType: 'VIDEO' | 'PHONE'
  onCallEnded?: () => void
}

// ========== ICE Servers ==========

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
}

// ========== Hook ==========

export function useWebRTC({
  consultationId,
  isRequester,
  token,
  callType,
  onCallEnded,
}: UseWebRTCOptions) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(new MediaStream())
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)

  const [callState, setCallState] = useState<CallState>('idle')
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(callType === 'VIDEO')
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Auth headers
  const getHeaders = useCallback(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) h['Authorization'] = `Bearer ${token}`
    return h
  }, [token])

  // Send signal to the signaling server
  const sendSignal = useCallback(async (type: string, data: Record<string, unknown> = {}) => {
    try {
      const res = await fetch(`/api/caregrid/consultations/${consultationId}/webrtc-signal`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ type, ...data }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        console.error('Signal send error:', errData)
      }
    } catch (err) {
      console.error('Signal send error:', err)
    }
  }, [consultationId, getHeaders])

  // Poll signal server for offer/answer/candidates
  const pollSignal = useCallback(async () => {
    try {
      const res = await fetch(`/api/caregrid/consultations/${consultationId}/webrtc-signal`, {
        headers: getHeaders(),
      })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }, [consultationId, getHeaders])

  // Get local media stream
  const getLocalStream = useCallback(async () => {
    try {
      const isVideo = callType === 'VIDEO'
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      localStreamRef.current = stream

      // Attach to video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // If voice call, disable video tracks initially
      if (!isVideo) {
        stream.getVideoTracks().forEach(track => (track.enabled = false))
      }

      return stream
    } catch (err) {
      console.error('Error accessing media devices:', err)
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Camera/microphone permission denied. Please allow access in your browser settings.')
        } else if (err.name === 'NotFoundError') {
          setError('No camera or microphone found. Please connect a device and try again.')
        } else {
          setError(`Media device error: ${err.message}`)
        }
      } else {
        setError('Could not access camera/microphone. Please check permissions.')
      }
      return null
    }
  }, [callType])

  // Setup peer connection with event handlers
  const setupPeerConnection = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnectionRef.current = pc

    // Add local tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream)
    })

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateType = isRequester ? 'offer-candidate' : 'answer-candidate'
        sendSignal(candidateType, { candidate: JSON.stringify(event.candidate.toJSON()) })
      }
    }

    // Handle remote track
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0]
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }
    }

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connected':
          setCallState('connected')
          // Start duration timer
          durationRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1)
          }, 1000)
          break
        case 'disconnected':
          // Wait a bit before ending — might reconnect
          setTimeout(() => {
            if (pc.connectionState === 'disconnected') {
              endCall()
            }
          }, 5000)
          break
        case 'failed':
          setError('Connection failed. This may be due to network restrictions.')
          endCall()
          break
      }
    }

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        setError('ICE connection failed. The other user may be behind a restrictive firewall.')
        endCall()
      }
    }

    return pc
  }, [isRequester, sendSignal])

  // Start call as requester (caller)
  const startAsCaller = useCallback(async () => {
    setCallState('connecting')
    setError(null)

    const stream = await getLocalStream()
    if (!stream) {
      setCallState('idle')
      return
    }

    try {
      const pc = setupPeerConnection(stream)
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      await pc.setLocalDescription(offer)
      await sendSignal('offer', { sdp: JSON.stringify(offer) })

      setCallState('ringing')

      // Poll for answer
      let lastAnswerLength = 0
      let lastAnswerCandidateLength = 0

      pollIntervalRef.current = setInterval(async () => {
        const signal = await pollSignal()
        if (!signal) return

        // Check if call was ended by the other party
        if (signal.status === 'COMPLETED' || signal.endedAt) {
          endCall()
          return
        }

        // Check for answer
        if (signal.answer && pc.signalingState === 'have-local-offer') {
          try {
            const answer = JSON.parse(signal.answer)
            await pc.setRemoteDescription(new RTCSessionDescription(answer))
          } catch (err) {
            console.error('Error setting remote description:', err)
          }
        }

        // Add answer ICE candidates
        if (signal.answerCandidates && signal.answerCandidates.length > lastAnswerCandidateLength) {
          const newCandidates = signal.answerCandidates.slice(lastAnswerCandidateLength)
          for (const cand of newCandidates) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(cand)))
            } catch { /* ignore duplicate/invalid candidates */ }
          }
          lastAnswerCandidateLength = signal.answerCandidates.length
        }
      }, 1500)
    } catch (err) {
      console.error('Error starting call:', err)
      setError('Failed to start the call. Please try again.')
      setCallState('idle')
    }
  }, [getLocalStream, setupPeerConnection, sendSignal, pollSignal])

  // Start call as consultant (callee — answering)
  const startAsCallee = useCallback(async () => {
    setCallState('connecting')
    setError(null)

    const stream = await getLocalStream()
    if (!stream) {
      setCallState('idle')
      return
    }

    try {
      // Fetch the offer first
      const signal = await pollSignal()
      if (!signal?.offer) {
        setCallState('ringing')
        // Poll until offer appears
        pollIntervalRef.current = setInterval(async () => {
          const sig = await pollSignal()
          if (!sig) return

          if (sig.status === 'COMPLETED' || sig.endedAt) {
            endCall()
            return
          }

          if (sig.offer) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            await answerOffer(sig, stream)
          }
        }, 1500)
        return
      }

      await answerOffer(signal, stream)
    } catch (err) {
      console.error('Error joining call:', err)
      setError('Failed to join the call.')
      setCallState('idle')
    }
  }, [getLocalStream, pollSignal])

  // Answer an offer
  const answerOffer = useCallback(async (signal: { offer: string; offerCandidates?: string[] }, stream?: MediaStream) => {
    setCallState('connecting')
    const localStream = stream || localStreamRef.current
    if (!localStream) return

    try {
      const pc = setupPeerConnection(localStream)
      const offer = JSON.parse(signal.offer)
      await pc.setRemoteDescription(new RTCSessionDescription(offer))

      // Add offer ICE candidates
      if (signal.offerCandidates?.length) {
        for (const cand of signal.offerCandidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(cand)))
          } catch { /* ignore */ }
        }
      }

      // Consume the offer candidates so we don't re-process them
      await sendSignal('consume-candidates', { candidate: 'offer-candidate' })

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await sendSignal('answer', { sdp: JSON.stringify(answer) })

      // Start polling for answer candidates from caller
      let lastAnswerCandidateLength = 0
      pollIntervalRef.current = setInterval(async () => {
        const sig = await pollSignal()
        if (!sig) return

        if (sig.status === 'COMPLETED' || sig.endedAt) {
          endCall()
          return
        }

        // Add any new offer candidates that came in after the initial set
        if (sig.offerCandidates && sig.offerCandidates.length > 0) {
          // Only process unconsumed ones
          for (const cand of sig.offerCandidates) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(cand)))
            } catch { /* ignore */ }
          }
          await sendSignal('consume-candidates', { candidate: 'offer-candidate' })
        }
      }, 1500)
    } catch (err) {
      console.error('Error answering call:', err)
      setError('Failed to answer the call.')
      setCallState('idle')
    }
  }, [setupPeerConnection, sendSignal, pollSignal])

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setMicOn(prev => !prev)
    }
  }, [])

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setCameraOn(prev => !prev)
    }
  }, [])

  // Switch camera (front/back on mobile)
  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current) return
    const videoTrack = localStreamRef.current.getVideoTracks()[0]
    if (!videoTrack) return

    try {
      const currentFacing = videoTrack.getSettings().facingMode
      const newFacing = currentFacing === 'user' ? 'environment' : 'user'

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
      })

      const newVideoTrack = newStream.getVideoTracks()[0]

      // Replace track in peer connection
      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video')
        if (sender) {
          await sender.replaceTrack(newVideoTrack)
        }
      }

      // Stop old video track
      videoTrack.stop()

      // Update local stream
      localStreamRef.current.removeTrack(videoTrack)
      localStreamRef.current.addTrack(newVideoTrack)

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
      }
    } catch (err) {
      console.error('Error switching camera:', err)
    }
  }, [])

  // End call
  const endCall = useCallback(async () => {
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    // Clear video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null

    // Clear intervals
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    if (durationRef.current) {
      clearInterval(durationRef.current)
      durationRef.current = null
    }

    // Notify server that call ended
    try {
      await fetch('/api/calls/end', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ consultationId }),
      })
    } catch { /* ignore */ }

    setCallState('ended')
    setCallDuration(0)
    onCallEnded?.()
  }, [consultationId, getHeaders, onCallEnded])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (durationRef.current) clearInterval(durationRef.current)
    }
  }, [])

  // Format duration as MM:SS or HH:MM:SS
  const formatDuration = useCallback((seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    if (h > 0) {
      return `${h}:${m}:${s}`
    }
    return `${m}:${s}`
  }, [])

  return {
    // Refs
    localVideoRef,
    remoteVideoRef,
    localStreamRef,
    peerConnectionRef,

    // State
    callState,
    micOn,
    cameraOn,
    callDuration,
    error,
    formatDuration,

    // Actions
    startAsCaller,
    startAsCallee,
    toggleMic,
    toggleCamera,
    switchCamera,
    endCall,

    // Setters
    setCallState,
    setError,
  }
}
