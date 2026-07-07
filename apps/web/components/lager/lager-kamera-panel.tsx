"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { LagerStreamLayout } from "@/components/lager/lager-stream-layout"
import { useLiveKitVisionRoom } from "@/hooks/use-livekit-vision-room"
import { hasLiveKitPublicEnv } from "@/lib/livekit/env"
import {
  loadCocoSsdModel,
  type CocoModelStatus,
} from "@/lib/vision/coco-ssd-detector"
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
  className?: string
}

export function LagerKameraPanel({ projectId, className }: LagerKameraPanelProps) {
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
    if (isPublishing && !remoteFeeds.some((f) => f.identity === "local")) {
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

  return (
    <div className={cn("flex min-h-0 flex-col px-4 pb-4 md:px-5 md:pb-5", className)}>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {!hasStreams ? (
          <p className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Kein Stream aktiv.
          </p>
        ) : (
          <LagerStreamLayout
            remoteFeeds={remoteFeeds}
            isPublishing={isPublishing}
            cameraStream={cameraStream}
            localDetections={localDetections}
            focusedFeedId={focusedFeedId}
            onFocusFeed={setFocusedFeedId}
            className="min-h-0 flex-1"
          />
        )}

        {error ? (
          <p className="mt-2 text-center text-xs text-destructive">{error}</p>
        ) : null}
      </div>

      <div className="mt-3 flex shrink-0 justify-center">
        <Button
          type="button"
          size="lg"
          variant={isPublishing ? "outline" : "default"}
          className="min-w-[10rem] rounded-full"
          onClick={toggleCamera}
          disabled={startingCamera || !liveKitConfigured || modelStatus === "failed"}
        >
          {startingCamera
            ? "Startet…"
            : isPublishing
              ? "Stoppen"
              : "Kamera starten"}
        </Button>
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
