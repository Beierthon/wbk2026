"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Camera, CircleAlert, Radio, ScanLine, Video, VideoOff } from "lucide-react"

import { VisionOverlayLayer } from "@/components/dashboard/vision-overlay-layer"
import { useVisionStreamPublisher } from "@/hooks/use-vision-stream-publisher"
import { useVisionStreamSubscriber } from "@/hooks/use-vision-stream-subscriber"
import { hasSupabasePublicEnv } from "@/lib/supabase/env"
import {
  loadCocoSsdModel,
  type CocoModelStatus,
} from "@/lib/vision/coco-ssd-detector"
import {
  VISION_STREAM_DETECT_INTERVAL_MS,
  VISION_STREAM_FRAME_INTERVAL_MS,
  visionScanFps,
} from "@/lib/vision/scan-config"
import {
  streamDetectionToVisionDetection,
  type VisionStreamSnapshot,
} from "@/lib/vision/stream-types"
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
  useSupabase: boolean,
  status: "idle" | "connecting" | "live" | "error",
  streaming: boolean,
  isStale: boolean
) {
  if (streaming) {
    return "Sendet Live"
  }

  if (!useSupabase) {
    return "Mock"
  }

  if (isStale) {
    return "Stream beendet"
  }

  if (status === "live") {
    return "Realtime Live"
  }

  if (status === "connecting") {
    return "Realtime verbindet"
  }

  if (status === "error") {
    return "Realtime offline"
  }

  return "Realtime wartet"
}

function StreamFrameImage({
  src,
  alt,
  dimmed = false,
}: {
  src: string | null | undefined
  alt: string
  dimmed?: boolean
}) {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null)
  const [pendingSrc, setPendingSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!src || src === displaySrc) {
      return
    }

    setPendingSrc(src)
  }, [displaySrc, src])

  return (
    <>
      {pendingSrc && pendingSrc !== displaySrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pendingSrc}
          alt=""
          aria-hidden
          className="hidden"
          onLoad={() => {
            setDisplaySrc(pendingSrc)
            setPendingSrc(null)
          }}
          onError={() => {
            setPendingSrc(null)
          }}
        />
      ) : null}
      {displaySrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displaySrc}
          alt={alt}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-150",
            dimmed && "opacity-60"
          )}
        />
      ) : null}
    </>
  )
}

export function VisionStreamPanel({ projectId }: VisionStreamPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const useSupabase = hasSupabasePublicEnv()

  const [streaming, setStreaming] = useState(false)
  const [startingCamera, setStartingCamera] = useState(false)
  const [modelStatus, setModelStatus] = useState<CocoModelStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [measuredFps, setMeasuredFps] = useState(0)
  const [localSnapshot, setLocalSnapshot] = useState<VisionStreamSnapshot | null>(
    null
  )

  const { snapshot: sharedSnapshot, status: connectionStatus, isStale } =
    useVisionStreamSubscriber({
      projectId,
      enabled: true,
      useSupabase,
    })

  const visibleSnapshot = streaming ? localSnapshot : (localSnapshot ?? sharedSnapshot)
  const overlayDetections = useMemo(
    () =>
      (visibleSnapshot?.detections ?? []).map(streamDetectionToVisionDetection),
    [visibleSnapshot?.detections]
  )

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStreaming(false)
    setLocalSnapshot(null)
    setMeasuredFps(0)
  }, [])

  useVisionStreamPublisher({
    projectId,
    enabled: streaming,
    useSupabase,
    videoRef,
    onSnapshot: setLocalSnapshot,
    onError: setError,
    onFpsChange: setMeasuredFps,
  })

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

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

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

  const targetFrameFps = visionScanFps(VISION_STREAM_FRAME_INTERVAL_MS)
  const displayFps = streaming && measuredFps > 0 ? measuredFps : targetFrameFps
  const lastScanTime = visibleSnapshot
    ? new Date(visibleSnapshot.capturedAt).toLocaleTimeString("de-DE")
    : null
  const isLive =
    streaming ||
    (!isStale && connectionStatus === "live" && Boolean(sharedSnapshot)) ||
    (!useSupabase && Boolean(sharedSnapshot))

  return (
    <Card className="overflow-hidden border-primary/20 shadow-sm">
      <CardHeader className="gap-4 border-b bg-muted/20 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">Live-Objekterkennung</CardTitle>
            <Badge variant="outline">COCO-SSD</Badge>
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
              {connectionBadgeLabel(useSupabase, connectionStatus, streaming, isStale)}
            </Badge>
          </div>
          <CardDescription className="max-w-2xl">
            Geteilter Kamerastream mit schnellen Frames und Objekt-Overlays.
            Mehrere Bildschirme empfangen Updates per Supabase Realtime.
          </CardDescription>
        </div>

        <Button
          size="lg"
          variant={streaming ? "destructive" : "default"}
          className="min-w-[12rem] shrink-0"
          onClick={toggleCamera}
          disabled={startingCamera}
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
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="flex flex-col gap-3">
            <div className="relative aspect-video overflow-hidden rounded-xl border bg-black shadow-inner">
              <video
                ref={videoRef}
                className={streaming ? "h-full w-full object-cover" : "hidden"}
                muted
                playsInline
              />
              {!streaming ? (
                <StreamFrameImage
                  src={visibleSnapshot?.image}
                  alt="Geteilter Kamerastream"
                  dimmed={isStale}
                />
              ) : null}
              {visibleSnapshot ? (
                <VisionOverlayLayer
                  detections={overlayDetections}
                  mediaWidth={16}
                  mediaHeight={9}
                  scanning={streaming && modelStatus === "loading"}
                />
              ) : null}
              {!streaming && !visibleSnapshot?.image && !isStale ? (
                <div className="absolute inset-0 grid place-items-center bg-muted/10 text-sm text-muted-foreground">
                  <span className="inline-flex flex-col items-center gap-2">
                    <Video className="size-8 opacity-60" />
                    {isStale ? "Stream beendet" : "Warte auf Kamerastream"}
                  </span>
                </div>
              ) : null}
              {streaming ? (
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
              <Badge variant="outline">~{displayFps} FPS Stream</Badge>
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
                {visibleSnapshot
                  ? `${visibleSnapshot.detectionCount} Objekte`
                  : "Noch kein Scan"}
              </Badge>
              {lastScanTime ? <span>Letzter Frame {lastScanTime}</span> : null}
            </div>

            {visibleSnapshot?.summary.message ? (
              <p className="text-sm text-muted-foreground">
                {visibleSnapshot.summary.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-muted/10 p-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-base font-medium">
                Erkannte Objekte
              </h2>
              <p className="text-sm text-muted-foreground">
                Labels aktualisieren etwas langsamer als die Frames.
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

        {!streaming && !sharedSnapshot && !isStale ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            <ScanLine className="size-4 shrink-0" />
            <span>
              Tippe <strong>Kamera starten</strong> auf dem Handy. Desktop-Viewer
              sehen denselben Stream in Echtzeit.
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
