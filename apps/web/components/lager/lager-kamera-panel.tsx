"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Camera, VideoOff } from "lucide-react"

import { LagerStreamLayout } from "@/components/lager/lager-stream-layout"
import { ShellNotifications } from "@/components/shell-notifications"
import { useLiveKitVisionRoom } from "@/hooks/use-livekit-vision-room"
import { hasLiveKitPublicEnv } from "@/lib/livekit/env"
import {
  loadCocoSsdModel,
  type CocoModelStatus,
} from "@/lib/vision/coco-ssd-detector"
import type { Aktivitaet } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

function mapCameraError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Kamera konnte nicht gestartet werden."
  }

  const name = error.name
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Kamerazugriff verweigert."
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "Keine Kamera gefunden."
  }
  if (name === "SecurityError" || name === "NotSupportedError") {
    return "Kamera erfordert HTTPS oder localhost."
  }

  return error.message || "Kamera konnte nicht gestartet werden."
}

interface LagerKameraPanelProps {
  projectId: string
  aktivitaeten: Aktivitaet[]
  className?: string
}

export function LagerKameraPanel({
  projectId,
  aktivitaeten,
  className,
}: LagerKameraPanelProps) {
  const detectVideoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const liveKitConfigured = hasLiveKitPublicEnv()

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [startingCamera, setStartingCamera] = useState(false)
  const [modelStatus, setModelStatus] = useState<CocoModelStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [focusedFeedId, setFocusedFeedId] = useState<string | null>(null)

  const { remoteFeeds, localDetections, isPublishing } = useLiveKitVisionRoom({
    projectId,
    enabled: liveKitConfigured,
    cameraStream,
    detectVideoRef,
    onError: setError,
  })

  useEffect(() => {
    const tiles = remoteFeeds.map((f) => f.identity)
    if (isPublishing && !tiles.includes("local")) {
      setFocusedFeedId((current) => current ?? "local")
      return
    }
    if (remoteFeeds.length === 0) {
      setFocusedFeedId(isPublishing ? "local" : null)
      return
    }
    setFocusedFeedId((current) => {
      if (current === "local" && isPublishing) return current
      if (current && remoteFeeds.some((f) => f.identity === current)) {
        return current
      }
      return remoteFeeds[0]?.identity ?? (isPublishing ? "local" : null)
    })
  }, [isPublishing, remoteFeeds])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraStream(null)
  }, [])

  useEffect(() => {
    const video = detectVideoRef.current
    if (!video || !cameraStream) return
    video.srcObject = cameraStream
    void video.play().catch(() => {})
  }, [cameraStream])

  useEffect(() => {
    void loadCocoSsdModel()
      .then((model) => setModelStatus(model ? "ready" : "failed"))
      .catch(() => setModelStatus("failed"))
  }, [])

  useEffect(() => stopCamera, [stopCamera])

  const hasStreams = isPublishing || remoteFeeds.length > 0

  async function startCamera() {
    setError(null)
    setStartingCamera(true)

    if (!liveKitConfigured) {
      setError("LiveKit ist nicht konfiguriert.")
      setStartingCamera(false)
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Browser unterstützt keinen Kamerazugriff.")
      setStartingCamera(false)
      return
    }

    try {
      setModelStatus("loading")
      const model = await loadCocoSsdModel()
      setModelStatus(model ? "ready" : "failed")
      if (!model) {
        setError("Erkennungsmodell konnte nicht geladen werden.")
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

  const statusLabel = useMemo(() => {
    if (isPublishing) return "Stream aktiv"
    if (remoteFeeds.length > 0) return `${remoteFeeds.length} Kameras`
    return "Bereit"
  }, [isPublishing, remoteFeeds.length])

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">
            Worker Kamera
          </h2>
          <p className="text-xs text-muted-foreground">{statusLabel}</p>
        </div>
        <ShellNotifications projectId={projectId} aktivitaeten={aktivitaeten} />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col gap-3">
        {hasStreams ? (
          <LagerStreamLayout
            remoteFeeds={remoteFeeds}
            isPublishing={isPublishing}
            cameraStream={cameraStream}
            localDetections={localDetections}
            focusedFeedId={focusedFeedId}
            onFocusFeed={setFocusedFeedId}
            className="min-h-[40vh] md:min-h-0"
          />
        ) : (
          <div className="flex min-h-[40vh] flex-1 items-center justify-center rounded-lg border border-dashed bg-muted/10 text-sm text-muted-foreground md:min-h-0">
            Kamera starten oder auf Stream warten
          </div>
        )}

        {error ? (
          <p className="text-center text-xs text-destructive">{error}</p>
        ) : null}

        {!liveKitConfigured ? (
          <p className="text-center text-xs text-muted-foreground">
            LiveKit-Umgebungsvariablen fehlen.
          </p>
        ) : null}

        <div className="flex shrink-0 justify-center pb-1">
          <Button
            size="lg"
            variant={isPublishing ? "outline" : "default"}
            className={cn(
              "min-w-[11rem] rounded-full",
              !isPublishing &&
                "bg-amber-400 text-amber-950 hover:bg-amber-500 dark:bg-amber-500 dark:text-amber-950"
            )}
            onClick={toggleCamera}
            disabled={startingCamera || !liveKitConfigured || modelStatus === "failed"}
          >
            {startingCamera ? (
              <>
                <Camera className="animate-pulse" data-icon="inline-start" />
                Startet…
              </>
            ) : isPublishing ? (
              <>
                <VideoOff data-icon="inline-start" />
                Stop Kamera
              </>
            ) : (
              <>
                <Camera data-icon="inline-start" />
                Start Kamera
              </>
            )}
          </Button>
        </div>
      </div>

      <video
        ref={detectVideoRef}
        className="pointer-events-none absolute h-px w-px opacity-0"
        playsInline
        muted
        aria-hidden
      />
    </div>
  )
}
