"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Camera, CircleAlert, LayoutGrid, Radio, ScanLine, VideoOff } from "lucide-react"

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
    return "Kamera konnte nicht gestartet werden."
  }

  if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
    return "Kameraberechtigung wurde verweigert."
  }

  return error.message || "Kamera konnte nicht gestartet werden."
}

function connectionBadgeLabel(
  status: "idle" | "connecting" | "live" | "error",
  isPublishing: boolean,
  remoteCount: number
) {
  if (isPublishing) {
    return remoteCount > 0 ? "Sendet + Empfaengt" : "Sendet WebRTC"
  }

  if (status === "live" && remoteCount > 0) {
    return "Monitor Live"
  }

  if (status === "connecting") {
    return "WebRTC verbindet"
  }

  if (status === "error") {
    return "WebRTC offline"
  }

  return "Warte auf Stream"
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
  const isLive =
    connectionStatus === "live" && (hasRemoteVideo || isPublishing)

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
        "LiveKit ist nicht konfiguriert. Setze NEXT_PUBLIC_LIVEKIT_URL sowie LIVEKIT_API_KEY und LIVEKIT_API_SECRET in Vercel."
      )
      setStartingCamera(false)
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Dieser Browser erlaubt keinen direkten Kamerazugriff.")
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
            <CardTitle className="text-lg">Live-Objekterkennung</CardTitle>
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
              {connectionBadgeLabel(connectionStatus, isPublishing, remoteFeeds.length)}
            </Badge>
            {remoteFeeds.length > 0 ? (
              <Badge variant="outline">{remoteFeeds.length} Kameras live</Badge>
            ) : null}
          </div>
          <CardDescription className="max-w-2xl">
            Monitor-Ansicht fuer alle Baustellenkameras. Starte deine Kamera, um
            zusaetzlich zu senden und andere Streams parallel zu sehen.
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
              Galerie
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "focus" ? "default" : "ghost"}
              onClick={() => setViewMode("focus")}
            >
              Fokus
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
                Kamera startet...
              </>
            ) : isPublishing ? (
              <>
                <VideoOff data-icon="inline-start" />
                Stream stoppen
              </>
            ) : (
              <>
                <Camera data-icon="inline-start" />
                Kamera starten
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-4">
        {!liveKitConfigured ? (
          <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <CircleAlert className="mt-0.5 shrink-0" />
            <span>
              LiveKit fehlt. Setze{" "}
              <code className="rounded bg-background px-1">NEXT_PUBLIC_LIVEKIT_URL</code>,{" "}
              <code className="rounded bg-background px-1">LIVEKIT_API_KEY</code> und{" "}
              <code className="rounded bg-background px-1">LIVEKIT_API_SECRET</code> in
              Vercel.
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
                ~{visionScanFps(VISION_STREAM_DETECT_INTERVAL_MS)} FPS Erkennung
              </Badge>
              <Badge variant="secondary">
                {modelStatus === "ready"
                  ? "Modell bereit"
                  : modelStatus === "loading"
                    ? "Modell laedt"
                    : modelStatus === "failed"
                      ? "Modellfehler"
                      : "Modell wartet"}
              </Badge>
              <Badge variant="secondary">
                {overlayDetections.length > 0
                  ? `${overlayDetections.length} Objekte`
                  : "Noch kein Scan"}
              </Badge>
              {lastScanTime ? <span>Letzter Scan {lastScanTime}</span> : null}
            </div>

            {activeSummary?.message ? (
              <p className="text-sm text-muted-foreground">{activeSummary.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-muted/10 p-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-base font-medium">
                Erkannte Objekte
              </h2>
              <p className="text-sm text-muted-foreground">
                Fokus-Kamera:{" "}
                {focusedFeedId === "local"
                  ? "Deine Kamera"
                  : focusedRemoteFeed
                    ? `Kamera ${focusedRemoteFeed.identity.slice(-4)}`
                    : "Keine Auswahl"}
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
                  Noch keine Objekte im fokussierten Stream.
                </p>
              )}
            </div>
          </div>
        </div>

        {!isPublishing && !hasRemoteVideo ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            <ScanLine className="size-4 shrink-0" />
            <span>
              Monitor-Modus ist aktiv. Starte eine Kamera auf dem Handy oder tippe{" "}
              <strong>Kamera starten</strong>, um selbst zu senden und parallel
              zuzuschauen.
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
