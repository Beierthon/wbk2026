"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Camera,
  CircleAlert,
  LayoutGrid,
  Radio,
  ScanLine,
  VideoOff,
} from "lucide-react"

import {
  VisionStreamStage,
  type VisionStreamViewMode,
} from "@/components/dashboard/vision-stream-stage"
import { useLiveKitVisionRoom } from "@/hooks/use-livekit-vision-room"
import { hasLiveKitPublicEnv } from "@/lib/livekit/env"
import {
  loadCocoSsdModel,
  type CocoModelStatus,
} from "@/lib/vision/coco-ssd-detector"
import {
  VISION_STREAM_DETECT_INTERVAL_MS,
  visionScanFps,
} from "@/lib/vision/scan-config"
import { streamDetectionToVisionDetection } from "@/lib/vision/stream-types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

interface VisionStreamPanelProps {
  projectId: string
}

function mapCameraError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Camera could not be started."
  }

  const name = error.name

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Camera permission was denied. Please allow camera access in browser or device settings."
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera found."
  }

  if (name === "NotReadableError" || name === "TrackStartError") {
    return "The camera is already in use by another application."
  }

  if (name === "SecurityError" || name === "NotSupportedError") {
    return "Camera access requires a secure context (HTTPS or localhost). On a phone over LAN without TLS, use demo scan."
  }

  if (name === "OverconstrainedError") {
    return "The requested camera is not available on this device."
  }

  return error.message || "Camera could not be started."
}

function connectionBadgeLabel(
  status: "idle" | "connecting" | "live" | "error",
  isPublishing: boolean,
  remoteCount: number
) {
  if (isPublishing) {
    return remoteCount > 0 ? "Sending + receiving" : "Sending WebRTC"
  }

  if (status === "live" && remoteCount > 0) {
    return "Monitor live"
  }

  if (status === "connecting") {
    return remoteCount > 0 ? "Monitor live" : "Connected, waiting for camera"
  }

  if (status === "error") {
    return "WebRTC offline"
  }

  return "Waiting for stream"
}

export function VisionStreamPanel({ projectId }: VisionStreamPanelProps) {
  const detectVideoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const liveKitConfigured = hasLiveKitPublicEnv()

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [startingCamera, setStartingCamera] = useState(false)
  const [modelStatus, setModelStatus] = useState<CocoModelStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [measuredFps, setMeasuredFps] = useState(0)
  const [viewMode, setViewMode] = useState<VisionStreamViewMode>("gallery")
  const [focusedFeedId, setFocusedFeedId] = useState<string | null>(null)

  const {
    connectionStatus,
    remoteFeeds,
    localDetections,
    localSummary,
    isPublishing,
    reconnect,
  } = useLiveKitVisionRoom({
    projectId,
    enabled: liveKitConfigured,
    cameraStream,
    detectVideoRef: detectVideoRef,
    onError: setError,
    onFpsChange: setMeasuredFps,
  })

  useEffect(() => {
    if (remoteFeeds.length === 0) {
      setFocusedFeedId(isPublishing ? "local" : null)
      return
    }

    setFocusedFeedId((current) => {
      if (current === "local" && isPublishing) {
        return current
      }

      if (current && remoteFeeds.some((feed) => feed.identity === current)) {
        return current
      }

      return remoteFeeds[0]?.identity ?? (isPublishing ? "local" : null)
    })
  }, [isPublishing, remoteFeeds])

  const focusedRemoteFeed = useMemo(
    () => remoteFeeds.find((feed) => feed.identity === focusedFeedId) ?? null,
    [focusedFeedId, remoteFeeds]
  )

  const sidebarDetections = useMemo(() => {
    if (focusedFeedId === "local" || (!focusedRemoteFeed && isPublishing)) {
      return localDetections
    }

    return focusedRemoteFeed?.detections ?? []
  }, [focusedFeedId, focusedRemoteFeed, isPublishing, localDetections])

  const activeSummary = useMemo(() => {
    if (focusedFeedId === "local" || (!focusedRemoteFeed && isPublishing)) {
      return localSummary
    }

    return focusedRemoteFeed?.summary ?? null
  }, [focusedFeedId, focusedRemoteFeed, isPublishing, localSummary])

  const overlayDetections = useMemo(
    () => sidebarDetections.map(streamDetectionToVisionDetection),
    [sidebarDetections]
  )

  const hasRemoteVideo = remoteFeeds.length > 0
  const isLive = connectionStatus === "live" && (hasRemoteVideo || isPublishing)
  const showReconnect =
    liveKitConfigured &&
    (connectionStatus === "error" || connectionStatus === "idle")

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraStream(null)
    setMeasuredFps(0)
  }, [])

  useEffect(() => {
    const video = detectVideoRef.current
    if (!video || !cameraStream) {
      return
    }

    video.srcObject = cameraStream
    void video.play().catch(() => {})
  }, [cameraStream])

  useEffect(() => {
    void loadCocoSsdModel()
      .then((model) => {
        setModelStatus(model ? "ready" : "failed")
        if (!model) {
          setError("Objekterkennungsmodell konnte nicht geladen werden.")
        }
      })
      .catch(() => setModelStatus("failed"))
  }, [])

  async function startCamera() {
    setError(null)
    setStartingCamera(true)

    if (!liveKitConfigured) {
      setError(
        "LiveKit is not configured. Set NEXT_PUBLIC_LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in Vercel."
      )
      setStartingCamera(false)
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not allow direct camera access.")
      setStartingCamera(false)
      return
    }

    try {
      setModelStatus("loading")
      const model = await loadCocoSsdModel()
      setModelStatus(model ? "ready" : "failed")

      if (!model) {
        setError("Objekterkennungsmodell konnte nicht geladen werden.")
        setStartingCamera(false)
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream
      setCameraStream(stream)
      setFocusedFeedId("local")
    } catch (cameraError) {
      setError(mapCameraError(cameraError))
    } finally {
      setStartingCamera(false)
    }
  }

  function toggleCamera() {
    if (isPublishing) {
      stopCamera()
      return
    }

    void startCamera()
  }

  useEffect(() => stopCamera, [stopCamera])

  const displayFps = isPublishing && measuredFps > 0 ? measuredFps : null
  const lastScanTime = focusedRemoteFeed?.capturedAt
    ? new Date(focusedRemoteFeed.capturedAt).toLocaleTimeString("de-DE")
    : null

  return (
    <Card className="overflow-hidden border-primary/20 shadow-sm">
      <CardHeader className="gap-4 border-b bg-muted/20 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">Live object detection</CardTitle>
            <Badge variant="outline">COCO-SSD</Badge>
            <Badge variant="outline">LiveKit</Badge>
            <Badge
              variant={isLive ? "default" : "outline"}
              className={cn(isLive && "gap-1.5")}
            >
              {isLive ? (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-foreground/70 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary-foreground" />
                </span>
              ) : (
                <Radio className="size-3" />
              )}
              {connectionBadgeLabel(
                connectionStatus,
                isPublishing,
                remoteFeeds.length
              )}
            </Badge>
            {remoteFeeds.length > 0 ? (
              <Badge variant="outline">{remoteFeeds.length} cameras live</Badge>
            ) : null}
          </div>
          <CardDescription className="max-w-2xl">
            Monitor view for all site cameras. Start your camera to broadcast as
            well and watch other streams in parallel.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border bg-background p-1">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "gallery" ? "default" : "ghost"}
              onClick={() => setViewMode("gallery")}
            >
              <LayoutGrid data-icon="inline-start" />
              Gallery
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "focus" ? "default" : "ghost"}
              onClick={() => setViewMode("focus")}
            >
              Focus
            </Button>
          </div>

          <Button
            size="lg"
            variant={isPublishing ? "destructive" : "default"}
            className="min-w-[12rem] shrink-0"
            onClick={toggleCamera}
            disabled={startingCamera || !liveKitConfigured}
          >
            {startingCamera ? (
              <>
                <Camera className="animate-pulse" data-icon="inline-start" />
                Camera starting...
              </>
            ) : isPublishing ? (
              <>
                <VideoOff data-icon="inline-start" />
                Stop stream
              </>
            ) : (
              <>
                <Camera data-icon="inline-start" />
                Start camera
              </>
            )}
          </Button>

          {showReconnect ? (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="shrink-0"
              onClick={reconnect}
            >
              <Radio data-icon="inline-start" />
              Reconnect
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-4">
        {!liveKitConfigured ? (
          <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <CircleAlert className="mt-0.5 shrink-0" />
            <span>
              LiveKit is missing. Set{" "}
              <code className="rounded bg-background px-1">
                NEXT_PUBLIC_LIVEKIT_URL
              </code>
              ,{" "}
              <code className="rounded bg-background px-1">
                LIVEKIT_API_KEY
              </code>{" "}
              und{" "}
              <code className="rounded bg-background px-1">
                LIVEKIT_API_SECRET
              </code>{" "}
              in Vercel.
            </span>
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="flex flex-col gap-3">
            <video
              ref={detectVideoRef}
              className="pointer-events-none absolute h-px w-px opacity-0"
              autoPlay
              muted
              playsInline
            />

            <VisionStreamStage
              viewMode={viewMode}
              remoteFeeds={remoteFeeds}
              isPublishing={isPublishing}
              cameraStream={cameraStream}
              localDetections={localDetections}
              focusedFeedId={focusedFeedId}
              onFocusFeed={setFocusedFeedId}
            />

            {error ? (
              <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <CircleAlert className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {displayFps ? (
                <Badge variant="outline">~{displayFps} FPS Video</Badge>
              ) : (
                <Badge variant="outline">WebRTC Video</Badge>
              )}
              <Badge variant="outline">
                ~{visionScanFps(VISION_STREAM_DETECT_INTERVAL_MS)} FPS detection
              </Badge>
              <Badge variant="secondary">
                {modelStatus === "ready"
                  ? "Model ready"
                  : modelStatus === "loading"
                    ? "Model loading"
                    : modelStatus === "failed"
                      ? "Model error"
                      : "Model waiting"}
              </Badge>
              <Badge variant="secondary">
                {overlayDetections.length > 0
                  ? `${overlayDetections.length} objects`
                  : "No scan yet"}
              </Badge>
              {lastScanTime ? <span>Last scan {lastScanTime}</span> : null}
            </div>

            {activeSummary?.message ? (
              <p className="text-sm text-muted-foreground">
                {activeSummary.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-muted/10 p-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-base font-medium">
                Detected objects
              </h2>
              <p className="text-sm text-muted-foreground">
                Focus camera:{" "}
                {focusedFeedId === "local"
                  ? "Your camera"
                  : focusedRemoteFeed
                    ? `Camera ${focusedRemoteFeed.identity.slice(-4)}`
                    : "No selection"}
              </p>
            </div>

            <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {overlayDetections.length > 0 ? (
                overlayDetections.map((detection) => (
                  <div
                    key={detection.id}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 text-sm shadow-sm"
                  >
                    <span className="font-medium">{detection.label}</span>
                    <Badge variant="secondary">
                      {Math.round(detection.confidence * 100)}%
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No objects in the focused stream yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {!isPublishing && !hasRemoteVideo ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            <ScanLine className="size-4 shrink-0" />
            <span>
              Monitor mode is active. Start a camera on the phone or tap{" "}
              <strong>Start camera</strong> to broadcast yourself and watch in
              parallel.
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
