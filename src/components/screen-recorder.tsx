"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Circle,
  Square,
  Pause,
  Play,
  Download,
  Monitor,
  AlertTriangle,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// ─── Types ───

type RecordingState = "idle" | "recording" | "paused" | "stopped"

interface ScreenRecorderProps {
  /** Optional callback when recording completes */
  onRecordingComplete?: (blob: Blob, duration: number) => void
  /** Whether to show the trigger button (default: true) */
  showTrigger?: boolean
}

// ─── Helpers ───

function formatTimer(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Component ───

export function ScreenRecorder({ onRecordingComplete, showTrigger = true }: ScreenRecorderProps) {
  const { toast } = useToast()

  // Recording state
  const [state, setState] = React.useState<RecordingState>("idle")
  const [timer, setTimer] = React.useState(0)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = React.useState<Blob | null>(null)
  const [showPreview, setShowPreview] = React.useState(false)
  const [filename, setFilename] = React.useState("")
  const [isSupported, setIsSupported] = React.useState(true)
  const [showHIPAAWarning, setShowHIPAAWarning] = React.useState(false)

  // Refs
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const timerIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = React.useRef<number>(0)
  const pausedDurationRef = React.useRef<number>(0)

  // Check browser support on mount
  React.useEffect(() => {
    const supported =
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices !== "undefined" &&
      typeof navigator.mediaDevices.getDisplayMedia === "function" &&
      typeof MediaRecorder !== "undefined"
    setIsSupported(supported)
  }, [])

  // ─── Timer (stopTimer declared first since startTimer depends on it) ───

  const stopTimer = React.useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [])

  const startTimer = React.useCallback(() => {
    stopTimer()
    timerIntervalRef.current = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - startTimeRef.current - pausedDurationRef.current) / 1000)
      setTimer(elapsed)
    }, 1000)
  }, [stopTimer])

  // ─── Stream cleanup ───

  const cleanupStream = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  // Cleanup on unmount (after stopTimer and cleanupStream are declared)
  React.useEffect(() => {
    return () => {
      stopTimer()
      cleanupStream()
    }
  }, [stopTimer, cleanupStream])

  // ─── Save metadata to API (declared before startRecording which uses it) ───

  const saveRecordingMetadata = React.useCallback(async (blob: Blob, duration: number, recordingFilename: string) => {
    try {
      await fetch("/api/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recordingFilename || `Screen Recording ${new Date().toLocaleString()}`,
          duration,
          fileSize: blob.size,
          format: "webm",
        }),
      })
    } catch {
      // Silently fail — this is optional metadata logging
    }
  }, [])

  // ─── Start recording ───

  const startRecording = React.useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Your browser does not support screen recording. Please use Chrome, Edge, or Firefox.",
        variant: "destructive",
      })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          width: { max: 1920 },
          height: { max: 1080 },
          frameRate: { max: 30 },
        },
        audio: false,
      })

      streamRef.current = stream

      // Detect supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
          ? "video/webm;codecs=vp8"
          : "video/webm"

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        setRecordedBlob(blob)

        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setShowPreview(true)

        const duration = Math.floor((Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000)

        // Generate default filename
        const date = new Date().toISOString().slice(0, 10)
        const time = new Date().toISOString().slice(11, 19).replace(/:/g, "-")
        const defaultFilename = `NurseOS-Recording-${date}_${time}`
        setFilename(defaultFilename)

        if (onRecordingComplete) {
          onRecordingComplete(blob, duration)
        }

        // Save metadata to API (fire-and-forget)
        saveRecordingMetadata(blob, duration, defaultFilename).catch(() => {
          // Silently fail — metadata saving is optional
        })

        setState("idle")
        setTimer(0)
        cleanupStream()
      }

      // Handle user stopping share via browser UI
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop()
          stopTimer()
          setState("stopped")
        }
      })

      recorder.start(2000) // Collect data every 2 seconds for reliability
      startTimeRef.current = Date.now()
      pausedDurationRef.current = 0
      setTimer(0)
      startTimer()
      setState("recording")
      setShowHIPAAWarning(false)

      toast({
        title: "Recording Started",
        description: "Screen recording is in progress. Use the floating controls to stop or pause.",
      })
    } catch (err: unknown) {
      cleanupStream()
      const errorMessage = err instanceof Error ? err.message : String(err)

      if (errorMessage.includes("Permission") || errorMessage.includes("denied") || errorMessage.includes("NotAllowedError")) {
        toast({
          title: "Permission Denied",
          description: "Screen recording permission was denied. Please allow screen sharing to record.",
          variant: "destructive",
        })
      } else if (errorMessage.includes("cancelled") || errorMessage.includes("abort")) {
        // User cancelled the picker — no error toast needed
      } else {
        toast({
          title: "Recording Error",
          description: "Failed to start screen recording. Please try again.",
          variant: "destructive",
        })
      }
    }
  }, [isSupported, startTimer, stopTimer, cleanupStream, onRecordingComplete, toast, saveRecordingMetadata])

  // ─── Pause / Resume ───

  const pauseRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause()
      stopTimer()
      pausedDurationRef.current = Date.now() - startTimeRef.current - timer * 1000
      setState("paused")
    }
  }, [stopTimer, timer])

  const resumeRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume()
      pausedDurationRef.current = Date.now() - startTimeRef.current - timer * 1000
      startTimer()
      setState("recording")
    }
  }, [startTimer, timer])

  // ─── Stop recording ───

  const stopRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")) {
      mediaRecorderRef.current.stop()
      stopTimer()
      setState("stopped")
    }
  }, [stopTimer])

  // ─── Download ───

  const downloadRecording = React.useCallback(() => {
    if (!recordedBlob) return

    const a = document.createElement("a")
    a.href = URL.createObjectURL(recordedBlob)
    a.download = `${filename || "recording"}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)

    toast({
      title: "Download Started",
      description: "Your screen recording is being downloaded to your device.",
    })
  }, [recordedBlob, filename, toast])

  // ─── Close preview ───

  const closePreview = React.useCallback(() => {
    setShowPreview(false)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setRecordedBlob(null)
    setFilename("")
  }, [previewUrl])

  // ─── Open HIPAA warning dialog ───

  const handleRecordClick = React.useCallback(() => {
    if (state === "idle") {
      setShowHIPAAWarning(true)
    }
  }, [state])

  // ─── Render ───

  return (
    <>
      {/* Trigger Button */}
      {showTrigger && (
        <Button
          variant="ghost"
          size="icon"
          className="relative size-8"
          onClick={handleRecordClick}
          disabled={!isSupported}
          title="Screen Record"
        >
          <Monitor className="size-4 text-muted-foreground" />
          {state === "recording" && (
            <span className="absolute -top-0.5 -right-0.5 flex size-3 items-center justify-center rounded-full bg-red-500">
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
            </span>
          )}
          <span className="sr-only">Screen Record</span>
        </Button>
      )}

      {/* Floating Recording Control Panel */}
      {(state === "recording" || state === "paused") && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center gap-3 rounded-2xl border bg-background/95 backdrop-blur-lg shadow-2xl px-4 py-3">
            {/* Recording indicator */}
            <div className="flex items-center gap-2">
              {state === "recording" ? (
                <div className="flex items-center gap-1.5">
                  <Circle className="size-3 fill-red-500 text-red-500 animate-pulse" />
                  <span className="text-xs font-medium text-red-500">REC</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Pause className="size-3 text-amber-500" />
                  <span className="text-xs font-medium text-amber-500">PAUSED</span>
                </div>
              )}
            </div>

            {/* Timer */}
            <Badge variant="outline" className="font-mono text-sm px-2.5 py-0.5 tabular-nums">
              {formatTimer(timer)}
            </Badge>

            {/* Pause / Resume Button */}
            {state === "recording" ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={pauseRecording}
              >
                <Pause className="size-3.5" />
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={resumeRecording}
              >
                <Play className="size-3.5" />
                Resume
              </Button>
            )}

            {/* Stop Button */}
            <Button
              variant="destructive"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={stopRecording}
            >
              <Square className="size-3.5 fill-current" />
              Stop
            </Button>
          </div>
        </div>
      )}

      {/* HIPAA Warning Dialog */}
      <Dialog open={showHIPAAWarning} onOpenChange={setShowHIPAAWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Privacy &amp; HIPAA Notice
            </DialogTitle>
            <DialogDescription className="text-left pt-2">
              Before you start screen recording, please be aware:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3">
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">&#8226;</span>
                  <span>Screen recordings may capture <strong>Protected Health Information (PHI)</strong> including patient data, medical records, and other sensitive information.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">&#8226;</span>
                  <span>Recordings are saved <strong>only to your device</strong> and are never uploaded to any server.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">&#8226;</span>
                  <span>You are responsible for ensuring compliance with HIPAA, NDPR, and your facility&apos;s data protection policies.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">&#8226;</span>
                  <span>Avoid recording screens displaying patient information unless authorized.</span>
                </li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              By proceeding, you acknowledge this notice and accept responsibility for the recorded content.
            </p>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setShowHIPAAWarning(false)}>
              Cancel
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
              onClick={() => {
                setShowHIPAAWarning(false)
                startRecording()
              }}
            >
              <Circle className="size-3.5 fill-current" />
              Start Recording
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview & Download Dialog */}
      <Dialog open={showPreview} onOpenChange={(open) => { if (!open) closePreview() }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="size-5 text-emerald-500" />
              Recording Preview
            </DialogTitle>
            <DialogDescription>
              Review your screen recording and download it to your device.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Video Preview */}
            {previewUrl && (
              <div className="relative rounded-lg overflow-hidden border bg-black">
                <video
                  src={previewUrl}
                  controls
                  className="w-full max-h-[360px] object-contain"
                  playsInline
                >
                  <track kind="captions" />
                </video>
              </div>
            )}

            {/* Recording Details */}
            {recordedBlob && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Duration:</span>{" "}
                  <span className="font-medium">{formatTimer(timer)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">File Size:</span>{" "}
                  <span className="font-medium">{formatFileSize(recordedBlob.size)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Format:</span>{" "}
                  <Badge variant="secondary" className="text-xs">WebM</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>{" "}
                  <span className="text-xs text-muted-foreground">Local device only</span>
                </div>
              </div>
            )}

            {/* Filename Input */}
            <div className="space-y-2">
              <Label htmlFor="filename" className="text-sm font-medium">
                Filename
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Enter a filename for your recording"
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">.webm</span>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/10 p-3">
              <p className="text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                This recording stays on your device and is never uploaded to any server. Handle with care per HIPAA/NDPR guidelines.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={closePreview}>
              <X className="size-4 mr-1.5" />
              Discard
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              onClick={downloadRecording}
              disabled={!recordedBlob}
            >
              <Download className="size-4" />
              Download Recording
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Compact inline trigger (for embedding in headers) ───

export function ScreenRecorderTrigger({
  onStartRecording,
}: {
  onStartRecording: () => void
}) {
  const [isSupported, setIsSupported] = React.useState(true)

  React.useEffect(() => {
    const supported =
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices !== "undefined" &&
      typeof navigator.mediaDevices.getDisplayMedia === "function" &&
      typeof MediaRecorder !== "undefined"
    setIsSupported(supported)
  }, [])

  if (!isSupported) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative size-8"
      onClick={onStartRecording}
      title="Screen Record"
    >
      <Monitor className="size-4 text-muted-foreground" />
      <span className="sr-only">Screen Record</span>
    </Button>
  )
}
