"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { LagerStreamGridLayout } from "@/components/lager/lager-stream-grid-layout"
import { LagerStreamLayout } from "@/components/lager/lager-stream-layout"
import { LagerVisionBatchDialog } from "@/components/lager/lager-vision-batch-dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLiveKitVisionRoom } from "@/hooks/use-livekit-vision-room"
import { hasLiveKitPublicEnv } from "@/lib/livekit/env"
import type { VisionLiveKitRole } from "@/lib/livekit/token"
import type { VisionProposalResolution } from "@/lib/livekit/vision-data"
import {
  loadCocoSsdModel,
  type CocoModelStatus,
} from "@/lib/vision/coco-ssd-detector"
import type { VisionInventoryProposal } from "@/lib/vision/inventory-counting"
import type { LagerArtikel } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const WAITING_RECONNECT_THRESHOLD_MS = 30_000

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
  /** Edge-to-edge viewport without outer padding or rounded frame. */
  variant?: "default" | "flush"
  /** Multi-camera overview grid instead of focus + filmstrip. */
  streamLayout?: "focus" | "grid"
  /** Extra bottom padding so the shutter clears the floating dock on mobile. */
  dockInset?: boolean
  /** LiveKit role for this client. Defaults to publisher on mobile, participant on desktop. */
  liveKitRole?: VisionLiveKitRole
  onStockChange?: (id: string, aktuell: number) => void
}

export function LagerKameraPanel({
  projectId,
  artikel,
  className,
  variant = "default",
  streamLayout = "focus",
  dockInset = false,
  liveKitRole,
  onStockChange,
}: LagerKameraPanelProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const resolvedLiveKitRole =
    liveKitRole ?? (isMobile ? "publisher" : "participant")
  const detectVideoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const liveKitConfigured = hasLiveKitPublicEnv()
  const activeProposalIdRef = useRef<string | null>(null)
  const proposalOpenRef = useRef(false)
  const resolutionSentRef = useRef(false)

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [startingCamera, setStartingCamera] = useState(false)
  const [modelStatus, setModelStatus] = useState<CocoModelStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [focusedFeedId, setFocusedFeedId] = useState<string | null>(null)
  const [inventoryProposals, setInventoryProposals] = useState<
    VisionInventoryProposal[]
  >([])
  const [proposalOpen, setProposalOpen] = useState(false)
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null)
  const [waitingSince, setWaitingSince] = useState<number | null>(null)
  const [waitingTimedOut, setWaitingTimedOut] = useState(false)

  useEffect(() => {
    activeProposalIdRef.current = activeProposalId
  }, [activeProposalId])

  useEffect(() => {
    proposalOpenRef.current = proposalOpen
  }, [proposalOpen])

  const openProposals = useCallback(
    (proposalId: string, proposals: VisionInventoryProposal[]) => {
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

      if (proposalOpenRef.current) {
        return
      }

      resolutionSentRef.current = false
      setActiveProposalId(proposalId)
      setInventoryProposals(actionable)

      if (isMobile) {
        setProposalOpen(true)
        return
      }

      toast.info("Bestätigung auf dem Handy ausstehend", {
        description: `${actionable.length} Artikel warten auf Prüfung.`,
      })
    },
    [isMobile]
  )

  const handleInventoryProposals = useCallback(
    (proposalId: string, proposals: VisionInventoryProposal[]) => {
      openProposals(proposalId, proposals)
    },
    [openProposals]
  )

  const handleRemoteInventoryProposals = useCallback(
    (proposalId: string, proposals: VisionInventoryProposal[]) => {
      openProposals(proposalId, proposals)
    },
    [openProposals]
  )

  const handleProposalResolution = useCallback(
    (proposalId: string, resolution: VisionProposalResolution) => {
      if (proposalId !== activeProposalIdRef.current) {
        return
      }

      resolutionSentRef.current = true
      setProposalOpen(false)
      setInventoryProposals([])
      setActiveProposalId(null)

      if (resolution === "saved") {
        router.refresh()
      }
    },
    [router]
  )

  const {
    remoteFeeds,
    localDetections,
    isPublishing,
    connectionStatus,
    reconnect,
    publishProposalResolution,
  } = useLiveKitVisionRoom({
    projectId,
    enabled: liveKitConfigured,
    role: resolvedLiveKitRole,
    artikel,
    cameraStream,
    detectVideoRef,
    onError: setError,
    onInventoryProposals: handleInventoryProposals,
    onRemoteInventoryProposals: handleRemoteInventoryProposals,
    onProposalResolution: handleProposalResolution,
  })

  useEffect(() => {
    if (connectionStatus === "waiting") {
      setWaitingSince((current) => current ?? Date.now())
      return
    }

    setWaitingSince(null)
    setWaitingTimedOut(false)
  }, [connectionStatus])

  useEffect(() => {
    if (!waitingSince || connectionStatus !== "waiting") {
      return
    }

    const timeout = window.setTimeout(() => {
      setWaitingTimedOut(true)
    }, WAITING_RECONNECT_THRESHOLD_MS)

    return () => window.clearTimeout(timeout)
  }, [connectionStatus, waitingSince])

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
    if (!liveKitConfigured) {
      return
    }

    void loadCocoSsdModel()
      .then((model) => {
        setModelStatus(model ? "ready" : "failed")
      })
      .catch(() => setModelStatus("failed"))
  }, [liveKitConfigured])

  useEffect(() => {
    const video = detectVideoRef.current
    if (!video || !cameraStream) return
    video.srcObject = cameraStream
    void video.play().catch(() => {})
  }, [cameraStream])

  useEffect(() => stopCamera, [stopCamera])

  const hasStreams = isPublishing || remoteFeeds.length > 0
  const showReconnect =
    liveKitConfigured &&
    (connectionStatus === "error" ||
      (connectionStatus === "waiting" && waitingTimedOut))

  const waitingMessage = (() => {
    if (!liveKitConfigured) {
      return "LiveKit ist nicht konfiguriert."
    }
    if (connectionStatus === "connecting") {
      return "Verbinde mit Live-Stream…"
    }
    if (connectionStatus === "waiting") {
      if (waitingTimedOut) {
        return "Kein Kamerastream erkannt. Erneut verbinden oder Kamera auf dem Handy starten."
      }
      return "Verbunden — warte auf Kamera vom Handy oder tippe unten zum Streamen."
    }
    if (connectionStatus === "error") {
      return "Stream-Verbindung fehlgeschlagen. Erneut verbinden oder Seite neu laden."
    }
    return "Tippe unten, um die Kamera zu starten."
  })()

  function handleReconnect() {
    setError(null)
    setWaitingTimedOut(false)
    setWaitingSince(null)
    reconnect()
  }

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
      if (modelStatus !== "ready") {
        setModelStatus("loading")
      }

      const [model, stream] = await Promise.all([
        modelStatus === "ready"
          ? Promise.resolve(true)
          : loadCocoSsdModel().then((loaded) => Boolean(loaded)),
        navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        }),
      ])

      setModelStatus(model ? "ready" : "failed")
      if (!model) {
        stream.getTracks().forEach((track) => track.stop())
        setError("Erkennungsmodell konnte nicht geladen werden.")
        setStartingCamera(false)
        return
      }

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
    if (isPublishing || cameraStream) {
      stopCamera()
      return
    }
    void startCamera()
  }

  function closeProposalDialog() {
    setProposalOpen(false)
    setInventoryProposals([])
    setActiveProposalId(null)
  }

  function handleProposalOpenChange(open: boolean) {
    setProposalOpen(open)

    if (open) {
      return
    }

    const proposalId = activeProposalIdRef.current
    if (proposalId && !resolutionSentRef.current) {
      void publishProposalResolution(proposalId, "dismissed")
    }

    resolutionSentRef.current = false
    closeProposalDialog()
  }

  const shutterDisabled =
    startingCamera || !liveKitConfigured || modelStatus === "failed"

  const isFlush = variant === "flush"
  const isGrid = streamLayout === "grid"
  const StreamLayout = isGrid ? LagerStreamGridLayout : LagerStreamLayout

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-col",
        isFlush ? "p-4 lg:p-5" : "p-2 sm:p-3 md:p-4 lg:p-5",
        className
      )}
    >
      <div
        className={cn(
          "relative flex min-h-0 flex-1 flex-col overflow-hidden bg-camera-surface",
          isFlush
            ? "rounded-xl border border-border"
            : "min-h-[min(52dvh,100%)] rounded-2xl sm:min-h-[min(56dvh,100%)] md:min-h-0 md:rounded-[1.5rem]"
        )}
      >
        {!hasStreams ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 sm:px-6">
            <p className="text-center text-sm text-muted-foreground">
              {waitingMessage}
            </p>
            {showReconnect ? (
              <Button type="button" size="sm" onClick={handleReconnect}>
                Erneut verbinden
              </Button>
            ) : null}
          </div>
        ) : (
          <StreamLayout
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
          <p className="absolute top-2 left-1/2 z-10 max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-full bg-camera-surface/90 px-3 py-1.5 text-center text-xs text-destructive backdrop-blur-sm sm:top-3">
            {error}
          </p>
        ) : null}

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center",
            dockInset
              ? "pt-8 pb-[max(1rem,env(safe-area-inset-bottom))] md:pt-12 md:pb-[max(1.25rem,env(safe-area-inset-bottom))]"
              : "pt-8 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pt-12 md:pb-[max(1rem,env(safe-area-inset-bottom))]"
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
                "flex size-14 items-center justify-center rounded-full border-[3px] transition-colors md:size-16 md:border-4 lg:size-[4.5rem]",
                isPublishing || cameraStream
                  ? "border-camera-surface-foreground/90"
                  : "border-camera-surface-foreground/75"
              )}
            >
              <span
                className={cn(
                  "bg-camera-surface-foreground transition-all duration-150 motion-reduce:transition-none",
                  isPublishing || cameraStream
                    ? "size-5 rounded-md bg-red-500 md:size-6 lg:size-7"
                    : "size-10 rounded-full md:size-12 lg:size-[3.25rem]"
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
        onOpenChange={handleProposalOpenChange}
        onSaved={(updates) => {
          for (const update of updates) {
            onStockChange?.(update.artikelId, update.aktuell)
          }
          setError(null)

          const proposalId = activeProposalIdRef.current
          if (proposalId) {
            resolutionSentRef.current = true
            void publishProposalResolution(proposalId, "saved")
          }
        }}
      />
    </div>
  )
}
