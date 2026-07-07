"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Camera, CircleAlert, ScanLine, Video, X } from "lucide-react"

import { VisionOverlayLayer } from "@/components/dashboard/vision-overlay-layer"
import { useVisionStreamPublisher } from "@/hooks/use-vision-stream-publisher"
import { useVisionStreamSubscriber } from "@/hooks/use-vision-stream-subscriber"
import { hasSupabasePublicEnv } from "@/lib/supabase/env"
import {
  loadCocoSsdModel,
  type CocoModelStatus,
} from "@/lib/vision/coco-ssd-detector"
import {
  VISION_STREAM_SCAN_INTERVAL_MS,
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
  status: "idle" | "connecting" | "live" | "error"
) {
  if (!useSupabase) {
    return "Mock"
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

export function VisionStreamPanel({ projectId }: VisionStreamPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const useSupabase = hasSupabasePublicEnv()

  const [open, setOpen] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [startingCamera, setStartingCamera] = useState(false)
  const [modelStatus, setModelStatus] = useState<CocoModelStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [localSnapshot, setLocalSnapshot] = useState<VisionStreamSnapshot | null>(
    null
  )

  const { snapshot: sharedSnapshot, status: connectionStatus } =
    useVisionStreamSubscriber({
      projectId,
      enabled: !streaming,
      useSupabase,
    })

  const visibleSnapshot = localSnapshot ?? sharedSnapshot
  const overlayDetections = useMemo(
    () =>
      (visibleSnapshot?.detections ?? []).map(streamDetectionToVisionDetection),
    [visibleSnapshot?.detections]
  )

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStreaming(false)
  }, [])

  useVisionStreamPublisher({
    projectId,
    enabled: streaming,
    useSupabase,
    videoRef,
    onSnapshot: setLocalSnapshot,
    onError: setError,
  })

  const warmModel = useCallback(async () => {
    setModelStatus("loading")
    const model = await loadCocoSsdModel()
    setModelStatus(model ? "ready" : "failed")

    if (!model) {
      setError("Objekterkennungsmodell konnte nicht geladen werden.")
    }
  }, [])

  async function startCamera() {
    setOpen(true)
    setError(null)
    setStartingCamera(true)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Dieser Browser erlaubt keinen direkten Kamerazugriff.")
      setStartingCamera(false)
      return
    }

    try {
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
      void warmModel()
    } catch (cameraError) {
      setError(mapCameraError(cameraError))
    } finally {
      setStartingCamera(false)
    }
  }

  function closeCamera() {
    stopCamera()
    setLocalSnapshot(null)
    setOpen(false)
  }

  useEffect(() => stopCamera, [stopCamera])

  useEffect(() => {
    if (sharedSnapshot && !streaming) {
      setOpen(true)
    }
  }, [sharedSnapshot, streaming])

  const lastScanTime = visibleSnapshot
    ? new Date(visibleSnapshot.capturedAt).toLocaleTimeString("de-DE")
    : null

  return (
    <Card className="border-primary/25">
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Live-Objekterkennung mit geteiltem Kamerastream</CardTitle>
            <Badge variant="outline">COCO-SSD</Badge>
            <Badge
              variant={
                connectionStatus === "live" || !useSupabase
                  ? "secondary"
                  : "outline"
              }
            >
              {connectionBadgeLabel(useSupabase, connectionStatus)}
            </Badge>
          </div>
          <CardDescription>
            Das Handy erkennt alle sichtbaren Objekte live. Andere Browser
            empfangen Frames per Supabase Realtime — ohne Polling.
          </CardDescription>
        </div>
        <Button onClick={() => void startCamera()} disabled={startingCamera}>
          <Camera data-icon="inline-start" />
          {startingCamera ? "Kamera startet..." : "Handy-Kamera starten"}
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-3">
            <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
              <video
                ref={videoRef}
                className={streaming ? "h-full w-full object-cover" : "hidden"}
                muted
                playsInline
              />
              {!streaming && visibleSnapshot?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={visibleSnapshot.image}
                  alt="Geteilter Kamerastream"
                  className="h-full w-full object-cover"
                />
              ) : null}
              {visibleSnapshot ? (
                <VisionOverlayLayer
                  detections={overlayDetections}
                  mediaWidth={16}
                  mediaHeight={9}
                  scanning={
                    streaming ? modelStatus === "loading" : connectionStatus === "connecting"
                  }
                />
              ) : null}
              {!streaming && !visibleSnapshot?.image ? (
                <div className="absolute inset-0 grid place-items-center text-sm text-white/70">
                  <span className="inline-flex items-center gap-2">
                    <Video />
                    {startingCamera
                      ? "Kamera startet"
                      : "Warte auf geteilten Realtime-Stream"}
                  </span>
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
              <Badge variant="outline">
                {visionScanFps(VISION_STREAM_SCAN_INTERVAL_MS)} FPS Scan
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

          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-base font-medium">
                Erkannte Objekte
              </h2>
              <p className="text-sm text-muted-foreground">
                Alle COCO-SSD-Klassen im aktuellen Frame.
              </p>
            </div>

            <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {overlayDetections.length > 0 ? (
                overlayDetections.map((detection) => (
                  <div
                    key={detection.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
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

            <div className="mt-auto flex flex-wrap justify-end gap-2">
              {streaming ? (
                <Button variant="outline" onClick={closeCamera}>
                  <X data-icon="inline-start" />
                  Kamera stoppen
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {!open ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ScanLine />
            <span>
              Starte die Kamera auf dem Handy. Desktop-Viewer erhalten Updates
              ueber Supabase Realtime.
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
