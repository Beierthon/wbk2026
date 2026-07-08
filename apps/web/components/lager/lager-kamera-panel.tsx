"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { LagerStreamLayout } from "@/components/lager/lager-stream-layout"
import { LagerVisionBatchDialog } from "@/components/lager/lager-vision-batch-dialog"
import { useLiveKitVisionRoom } from "@/hooks/use-livekit-vision-room"
import { hasLiveKitPublicEnv } from "@/lib/livekit/env"
import {
  loadCocoSsdModel,
  type CocoModelStatus,
} from "@/lib/vision/coco-ssd-detector"
import type { VisionInventoryProposal } from "@/lib/vision/inventory-counting"
import type { LagerArtikel } from "@workspace/domain"
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
  artikel: LagerArtikel[]
  className?: string
  /** Extra bottom padding so the shutter clears the floating dock on mobile. */
  dockInset?: boolean
  onStockChange?: (id: string, aktuell: number) => void
}

export function LagerKameraPanel({
  projectId,
  artikel,
  className,
  dockInset = false,
  onStockChange,
}: LagerKameraPanelProps) {
  const detectVideoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const liveKitConfigured = hasLiveKitPublicEnv()

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [startingCamera, setStartingCamera] = useState(false)
  const [modelStatus, setModelStatus] = useState<CocoModelStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [focusedFeedId, setFocusedFeedId] = useState<string | null>(null)
  const [liveKitEnabled, setLiveKitEnabled] = useState(false)
  const [inventoryProposals, setInventoryProposals] = useState<
    VisionInventoryProposal[]
  >([])
  const [proposalOpen, setProposalOpen] = useState(false)

  const handleInventoryProposals = useCallback(
    (proposals: VisionInventoryProposal[]) => {
      const actionable = proposals.filter(
        (proposal) => proposal.status === "proposal"
      )
      const unchanged = proposals.filter(
        (proposal) => proposal.status === "unchanged"
      )

      for (const proposal of unchanged) {
        toast.info(`${proposal.artikelName}: Bestand ist bereits aktuell`)
      }

      if (actionable.length === 0) {
        return
      }

      setInventoryProposals(actionable)
      setProposalOpen(true)
    },
    []
  )

  const { remoteFeeds, localDetections, isPublishing } = useLiveKitVisionRoom({
    projectId,
    enabled: liveKitEnabled,
    artikel,
    cameraStream,
    detectVideoRef,
    onError: setError,
    onInventoryProposals: handleInventoryProposals,
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
    setLiveKitEnabled(false)
  }, [])

  useEffect(() => {
    const video = detectVideoRef.current
    if (!video || !cameraStream) return
    video.srcObject = cameraStream
    void video.play().catch(() => {})
  }, [cameraStream])

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
      setLiveKitEnabled(true)
      setFocusedFeedId("local")
    } catch (cameraError) {
      setError(mapCameraError(cameraError))
    } finally {
      setStartingCamera(false)
    }
  }

  function toggleCamera() {
    if (isPublishing || cameraStream) {
      stopCamera()
      return
    }
    void startCamera()
  }

  const shutterDisabled =
    startingCamera || !liveKitConfigured || modelStatus === "failed"

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-col p-2 sm:p-3 md:p-4 lg:p-5",
        className
      )}
    >
      <div
        className={cn(
          "relative flex min-h-[min(52dvh,100%)] flex-1 flex-col overflow-hidden rounded-xl bg-black sm:min-h-[min(56dvh,100%)] sm:rounded-2xl md:min-h-0 md:rounded-[1.25rem]"
        )}
      >
        {!hasStreams ? (
          <p className="flex flex-1 items-center justify-center px-4 text-center text-sm text-white/70 sm:px-6">
            Tippe unten, um die Kamera zu starten.
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
          <p className="absolute top-2 left-1/2 z-10 max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 text-center text-xs text-red-300 sm:top-3">
            {error}
          </p>
        ) : null}

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center",
            dockInset
              ? "pt-12 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pt-16"
              : "pt-12 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-16"
          )}
        >
          <button
            type="button"
            className="pointer-events-auto touch-manipulation disabled:opacity-50"
            onClick={toggleCamera}
            disabled={shutterDisabled}
            aria-label={
              isPublishing || cameraStream ? "Kamera stoppen" : "Kamera starten"
            }
          >
            <span
              className={cn(
                "flex size-16 items-center justify-center rounded-full border-4 transition-colors sm:size-[4.5rem]",
                isPublishing || cameraStream
                  ? "border-white/90"
                  : "border-white/80"
              )}
            >
              <span
                className={cn(
                  "bg-white transition-all duration-150 motion-reduce:transition-none",
                  isPublishing || cameraStream
                    ? "size-6 rounded-md bg-red-500 sm:size-7"
                    : "size-12 rounded-full sm:size-[3.25rem]"
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <video
        ref={detectVideoRef}
        className="pointer-events-none absolute h-px w-px opacity-0"
        playsInline
        muted
        aria-hidden
      />

      <LagerVisionBatchDialog
        key={inventoryProposals.map((p) => p.artikelId).join(",")}
        proposals={inventoryProposals}
        open={proposalOpen}
        onOpenChange={(open) => {
          setProposalOpen(open)
          if (!open) {
            setInventoryProposals([])
          }
        }}
        onSaved={(updates) => {
          for (const update of updates) {
            onStockChange?.(update.artikelId, update.aktuell)
          }
          setError(null)
        }}
      />
    </div>
  )
}
