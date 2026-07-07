"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Video } from "lucide-react"

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
    <div className={cn("flex min-h-0 flex-col", className)}>
      <header className="mb-4 flex shrink-0 items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Live
          </p>
          <h2 className="mt-1 text-lg font-medium tracking-tight">Worker-Kamera</h2>
        </div>
        <ShellNotifications
          projectId={projectId}
          aktivitaeten={aktivitaeten}
          hideLogLink
          showBellIcon
          triggerLabel="Benachrichtigungen"
        />
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {!hasStreams ? (
          <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-full border border-border bg-background shadow-sm">
              <Video className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Kein Kamerastream aktiv</p>
              <p className="max-w-[16rem] text-xs text-muted-foreground">
                Starten Sie die Kamera, um den Lagerbereich live zu überwachen.
              </p>
            </div>
          </div>
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
          <p className="mt-3 text-center text-xs text-destructive">{error}</p>
        ) : null}
      </div>

      <div className="mt-4 flex shrink-0 justify-center border-t border-border pt-4">
        <Button
          type="button"
          size="lg"
          variant={isPublishing ? "outline" : "default"}
          className="min-w-[11rem]"
          onClick={toggleCamera}
          disabled={startingCamera || !liveKitConfigured || modelStatus === "failed"}
        >
          {startingCamera
            ? "Startet…"
            : isPublishing
              ? "Kamera stoppen"
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
