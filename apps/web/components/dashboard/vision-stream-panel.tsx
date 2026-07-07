"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Camera, CircleAlert, Radio, ScanLine, Video, VideoOff } from "lucide-react"

import {
  LiveKitLocalVideo,
  LiveKitRemoteVideo,
} from "@/components/dashboard/livekit-remote-video"
import { VisionOverlayLayer } from "@/components/dashboard/vision-overlay-layer"
import { useLiveKitVisionPublisher } from "@/hooks/use-livekit-vision-publisher"
import { useLiveKitVisionSubscriber } from "@/hooks/use-livekit-vision-subscriber"
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
  streaming: boolean,
  hasRemoteVideo: boolean
) {
  if (streaming) {
    return "Sendet WebRTC"
  }

  if (status === "live" && hasRemoteVideo) {
    return "WebRTC Live"
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
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const liveKitConfigured = hasLiveKitPublicEnv()

  const [streaming, setStreaming] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [startingCamera, setStartingCamera] = useState(false)
  const [modelStatus, setModelStatus] = useState<CocoModelStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [measuredFps, setMeasuredFps] = useState(0)
  const [mediaWidth, setMediaWidth] = useState(16)
  const [mediaHeight, setMediaHeight] = useState(9)

  const {
    connectionStatus: publisherStatus,
    detections: publisherDetections,
    summary: publisherSummary,
  } = useLiveKitVisionPublisher({
    projectId,
    enabled: streaming && liveKitConfigured,
    stream: cameraStream,
    videoRef,
    onError: setError,
    onFpsChange: setMeasuredFps,
  })

  const {
    connectionStatus: viewerStatus,
    remoteFeeds,
    primaryFeed,
  } = useLiveKitVisionSubscriber({
    projectId,
    enabled: !streaming && liveKitConfigured,
  })

  const overlayDetections = useMemo(() => {
    const detections = streaming
      ? publisherDetections
      : (primaryFeed?.detections ?? [])

    return detections.map(streamDetectionToVisionDetection)
  }, [primaryFeed?.detections, publisherDetections, streaming])

  const activeSummary = streaming
    ? publisherSummary
    : (primaryFeed?.summary ?? null)

  const connectionStatus = streaming ? publisherStatus : viewerStatus
  const hasRemoteVideo = remoteFeeds.length > 0
  const isLive =
    (streaming && publisherStatus === "live") ||
    (!streaming && viewerStatus === "live" && hasRemoteVideo)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraStream(null)
    setStreaming(false)
    setMeasuredFps(0)
  }, [])

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
      setStreaming(true)
    } catch (cameraError) {
      setError(mapCameraError(cameraError))
    } finally {
      setStartingCamera(false)
    }
  }

  function toggleCamera() {
    if (streaming) {
      stopCamera()
      return
    }

    void startCamera()
  }

  useEffect(() => stopCamera, [stopCamera])

  const displayFps = streaming && measuredFps > 0 ? measuredFps : null
  const lastScanTime = primaryFeed?.capturedAt
    ? new Date(primaryFeed.capturedAt).toLocaleTimeString("de-DE")
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
              {connectionBadgeLabel(connectionStatus, streaming, hasRemoteVideo)}
            </Badge>
          </div>
          <CardDescription className="max-w-2xl">
            Echtzeit-WebRTC-Kamerastream mit Objekt-Overlays. Mehrere Geraete
            koennen gleichzeitig senden und zuschauen.
          </CardDescription>
        </div>

        <Button
          size="lg"
          variant={streaming ? "destructive" : "default"}
          className="min-w-[12rem] shrink-0"
          onClick={toggleCamera}
          disabled={startingCamera || !liveKitConfigured}
        >
          {startingCamera ? (
            <>
              <Camera className="animate-pulse" data-icon="inline-start" />
              Kamera startet...
            </>
          ) : streaming ? (
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
            <div
              className={cn(
                "relative aspect-video overflow-hidden rounded-xl border bg-black shadow-inner",
                remoteFeeds.length > 1 && !streaming && "grid grid-cols-2 gap-px bg-border"
              )}
            >
              {streaming ? (
                <LiveKitLocalVideo
                  stream={cameraStream}
                  videoRef={videoRef}
                  className="h-full w-full object-cover"
                  onDimensionsChange={(width, height) => {
                    setMediaWidth(width)
                    setMediaHeight(height)
                  }}
                />
              ) : remoteFeeds.length > 0 ? (
                remoteFeeds.map((feed) => (
                  <LiveKitRemoteVideo
                    key={feed.identity}
                    track={feed.videoTrack}
                    className="h-full w-full object-cover"
                    onDimensionsChange={(width, height) => {
                      setMediaWidth(width)
                      setMediaHeight(height)
                    }}
                  />
                ))
              ) : null}

              {(streaming || hasRemoteVideo) && overlayDetections.length >= 0 ? (
                <VisionOverlayLayer
                  detections={overlayDetections}
                  mediaWidth={mediaWidth}
                  mediaHeight={mediaHeight}
                  scanning={streaming && modelStatus === "loading"}
                />
              ) : null}

              {!streaming && !hasRemoteVideo ? (
                <div className="absolute inset-0 grid place-items-center bg-muted/10 text-sm text-muted-foreground">
                  <span className="inline-flex flex-col items-center gap-2">
                    <Video className="size-8 opacity-60" />
                    Warte auf Kamerastream
                  </span>
                </div>
              ) : null}

              {streaming && publisherStatus === "live" ? (
                <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-red-600/90 px-2.5 py-1 text-xs font-medium text-white shadow">
                  LIVE
                </div>
              ) : null}
            </div>

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
              {remoteFeeds.length > 1 ? (
                <Badge variant="outline">{remoteFeeds.length} Kameras</Badge>
              ) : null}
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
                Labels kommen vom sendenden Geraet (~3 FPS).
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
                  Noch keine Objekte im Stream.
                </p>
              )}
            </div>
          </div>
        </div>

        {!streaming && !hasRemoteVideo ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            <ScanLine className="size-4 shrink-0" />
            <span>
              Tippe <strong>Kamera starten</strong> auf dem Handy. Desktop-Viewer
              sehen denselben WebRTC-Stream in Echtzeit.
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
