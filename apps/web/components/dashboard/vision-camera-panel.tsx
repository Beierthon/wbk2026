"use client"

import type {
  DetectedObject,
  ObjectDetection,
} from "@tensorflow-models/coco-ssd"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Camera,
  Check,
  CircleAlert,
  ClipboardCheck,
  RefreshCw,
  ScanLine,
  TriangleAlert,
  Video,
  X,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const CHAIR_SYSTEM_TARGET = 3
const SCAN_INTERVAL_MS = 1000
const SHARED_STREAM_POLL_MS = 1400
const MAX_SCAN_TICKS = 8
const CHAIR_FALLBACK_CLASSES = new Set([
  "airplane",
  "bench",
  "couch",
  "dining table",
])

interface DetectionBox {
  x: number
  y: number
  width: number
  height: number
}

interface ChairDetection {
  id: string
  label: "Stuhl"
  confidence: number
  box: DetectionBox
}

interface ChairScanResult {
  capturedAt: string
  detected: number
  averageCount: number
  detections: ChairDetection[]
  image?: string
  source: "coco-ssd-chair-detector"
}

interface ChairScanTick {
  id: string
  capturedAt: string
  count: number
  confidence: number
}

interface ConfirmedChairUpdate {
  capturedAt: string
  chairCount: number
  detections: ChairDetection[]
}

interface ChairStreamResponse {
  data: ChairScanResult | null
  error: { message: string } | null
}

interface VisionCameraPanelProps {
  projectId: string
  initialChairCount?: number
}

function boxFromCocoDetection(
  detection: DetectedObject,
  video: HTMLVideoElement
): DetectionBox {
  const [x, y, width, height] = detection.bbox

  return {
    x: Math.max(0, Math.round((x / video.videoWidth) * 100)),
    y: Math.max(0, Math.round((y / video.videoHeight) * 100)),
    width: Math.min(100, Math.round((width / video.videoWidth) * 100)),
    height: Math.min(100, Math.round((height / video.videoHeight) * 100)),
  }
}

function isLikelyForegroundChair(
  detection: DetectedObject,
  video: HTMLVideoElement
) {
  if (!CHAIR_FALLBACK_CLASSES.has(detection.class) || detection.score < 0.25) {
    return false
  }

  const [x, y, width, height] = detection.bbox
  const areaRatio = (width * height) / (video.videoWidth * video.videoHeight)
  const widthRatio = width / video.videoWidth
  const heightRatio = height / video.videoHeight
  const lowerEdgeRatio = (y + height) / video.videoHeight
  const aspectRatio = height / Math.max(width, 1)
  const centerXRatio = (x + width / 2) / video.videoWidth

  return (
    areaRatio >= 0.12 &&
    widthRatio >= 0.18 &&
    heightRatio >= 0.28 &&
    lowerEdgeRatio >= 0.48 &&
    aspectRatio >= 0.85 &&
    centerXRatio >= 0.08 &&
    centerXRatio <= 0.92
  )
}

function averagePositiveChairCount(ticks: ChairScanTick[]) {
  const positiveTicks = ticks.filter((tick) => tick.count > 0)

  if (positiveTicks.length === 0) {
    return 0
  }

  const average =
    positiveTicks.reduce((sum, tick) => sum + tick.count, 0) /
    positiveTicks.length

  return Math.max(1, Math.round(average))
}

function captureVideoFrame(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas")
  const scale = Math.min(1, 960 / video.videoWidth)

  canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale))

  const context = canvas.getContext("2d")

  if (!context) {
    return undefined
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL("image/jpeg", 0.68)
}

function buildChairResult(
  detections: DetectedObject[],
  video: HTMLVideoElement,
  previousTicks: ChairScanTick[]
): ChairScanResult {
  const explicitChairDetections = detections
    .filter((detection) => detection.class === "chair")
    .sort((left, right) => right.score - left.score)
    .slice(0, 12)
  const chairDetections =
    explicitChairDetections.length > 0
      ? explicitChairDetections
      : detections
          .filter((detection) => isLikelyForegroundChair(detection, video))
          .sort((left, right) => right.score - left.score)
          .slice(0, 1)

  const capturedAt = new Date().toISOString()
  const mappedDetections = chairDetections.map((detection, index) => ({
    id: `${capturedAt}-chair-${index + 1}`,
    label: "Stuhl" as const,
    confidence: Number(detection.score.toFixed(2)),
    box: boxFromCocoDetection(detection, video),
  }))
  const confidence =
    mappedDetections.length > 0
      ? mappedDetections.reduce((sum, detection) => sum + detection.confidence, 0) /
        mappedDetections.length
      : 0
  const nextTicks = [
    {
      id: capturedAt,
      capturedAt,
      count: mappedDetections.length,
      confidence,
    },
    ...previousTicks,
  ].slice(0, MAX_SCAN_TICKS)

  return {
    capturedAt,
    detected: mappedDetections.length,
    averageCount: averagePositiveChairCount(nextTicks),
    source: "coco-ssd-chair-detector",
    detections: mappedDetections,
    image: captureVideoFrame(video),
  }
}

export function VisionCameraPanel({
  projectId,
  initialChairCount = CHAIR_SYSTEM_TARGET,
}: VisionCameraPanelProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const intervalRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chairModelRef = useRef<ObjectDetection | null>(null)
  const scanTicksRef = useRef<ChairScanTick[]>([])

  const [open, setOpen] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [startingCamera, setStartingCamera] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [modelStatus, setModelStatus] = useState<
    "idle" | "loading" | "ready" | "failed"
  >("idle")
  const [error, setError] = useState<string | null>(null)
  const [latestResult, setLatestResult] = useState<ChairScanResult | null>(null)
  const [sharedResult, setSharedResult] = useState<ChairScanResult | null>(null)
  const [confirmedUpdate, setConfirmedUpdate] =
    useState<ConfirmedChairUpdate | null>(null)
  const [scanTicks, setScanTicks] = useState<ChairScanTick[]>([])

  const visibleResult = latestResult ?? sharedResult
  const visibleChairCount = visibleResult?.averageCount ?? 0
  const chairActualCount = confirmedUpdate?.chairCount ?? initialChairCount
  const chairDifference = chairActualCount - CHAIR_SYSTEM_TARGET
  const latestDifference = visibleChairCount - CHAIR_SYSTEM_TARGET
  const canConfirm = Boolean(latestResult && latestResult.averageCount > 0)

  const averageConfidence = useMemo(() => {
    const positiveDetections = visibleResult?.detections ?? []

    if (positiveDetections.length === 0) {
      return 0
    }

    return (
      positiveDetections.reduce(
        (sum, detection) => sum + detection.confidence,
        0
      ) / positiveDetections.length
    )
  }, [visibleResult])

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStreaming(false)
  }, [])

  const loadChairModel = useCallback(async () => {
    if (chairModelRef.current) {
      return chairModelRef.current
    }

    setModelStatus("loading")

    try {
      const [tf, cocoSsd] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("@tensorflow-models/coco-ssd"),
      ])

      await tf.ready()

      const model = await cocoSsd.load({
        base: "lite_mobilenet_v2",
      })

      chairModelRef.current = model
      setModelStatus("ready")

      return model
    } catch {
      setModelStatus("failed")
      setError("Stuhl-Erkennungsmodell konnte nicht geladen werden.")

      return null
    }
  }, [])

  const publishSharedResult = useCallback(async (result: ChairScanResult) => {
    if (!result.image) {
      return
    }

    try {
      await fetch("/api/vision/chair-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      })
    } catch {
      setError("Livebild konnte nicht fuer andere Bildschirme geteilt werden.")
    }
  }, [])

  const applyResultTick = useCallback(
    (result: ChairScanResult) => {
    const confidence =
      result.detections.length > 0
        ? result.detections.reduce(
            (sum, detection) => sum + detection.confidence,
            0
          ) / result.detections.length
        : 0
    const tick: ChairScanTick = {
      id: result.capturedAt,
      capturedAt: result.capturedAt,
      count: result.detected,
      confidence,
    }

    const nextTicks = [tick, ...scanTicksRef.current].slice(0, MAX_SCAN_TICKS)
    const averageCount = averagePositiveChairCount(nextTicks)

    scanTicksRef.current = nextTicks
    setScanTicks(nextTicks)
    setLatestResult({ ...result, averageCount })
    setSharedResult({ ...result, averageCount })
    void publishSharedResult({ ...result, averageCount })
    },
    [publishSharedResult]
  )

  const inspectFrame = useCallback(async () => {
    const video = videoRef.current

    if (!video || scanning || !video.videoWidth || !video.videoHeight) {
      return
    }

    setScanning(true)

    try {
      const model = await loadChairModel()

      if (!model) {
        return
      }

      const detections = await model.detect(video, 20, 0.25)
      const result = buildChairResult(detections, video, scanTicksRef.current)
      applyResultTick(result)
      setError(null)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Stuhl-Erkennung ist fehlgeschlagen."
      )
    } finally {
      setScanning(false)
    }
  }, [applyResultTick, loadChairModel, scanning])

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
      void loadChairModel()
      window.setTimeout(() => void inspectFrame(), 600)
      intervalRef.current = window.setInterval(() => {
        void inspectFrame()
      }, SCAN_INTERVAL_MS)
    } catch (cameraError) {
      setError(
        cameraError instanceof Error
          ? cameraError.message
          : "Kamera konnte nicht gestartet werden."
      )
    } finally {
      setStartingCamera(false)
    }
  }

  function closeCamera() {
    stopCamera()
    setOpen(false)
  }

  async function confirmResult() {
    if (!latestResult || latestResult.averageCount < 1) {
      return
    }

    setConfirming(true)
    setError(null)

    try {
      const response = await fetch("/api/vision/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          capturedAt: latestResult.capturedAt,
          chairCount: latestResult.averageCount,
        }),
      })
      const body = (await response.json()) as {
        data?: { chairCount?: number; capturedAt?: string }
        error?: { message?: string }
      }

      if (!response.ok) {
        throw new Error(body.error?.message ?? "Update konnte nicht bestaetigt werden.")
      }

      const nextChairCount = body.data?.chairCount ?? latestResult.averageCount

      setConfirmedUpdate({
        capturedAt: body.data?.capturedAt ?? latestResult.capturedAt,
        detections: latestResult.detections,
        chairCount: nextChairCount,
      })
      router.refresh()
      closeCamera()
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Update konnte nicht bestaetigt werden."
      )
    } finally {
      setConfirming(false)
    }
  }

  function rejectResult() {
    setLatestResult(null)
    setError("Erkennung verworfen. Der Systembestand wurde nicht geaendert.")
  }

  function resetLocalScan() {
    setConfirmedUpdate(null)
    setLatestResult(null)
    setScanTicks([])
    scanTicksRef.current = []
    setError(null)
  }

  useEffect(() => stopCamera, [stopCamera])

  useEffect(() => {
    let cancelled = false

    async function fetchSharedSnapshot() {
      try {
        const response = await fetch("/api/vision/chair-stream", {
          cache: "no-store",
        })
        const body = (await response.json()) as ChairStreamResponse

        if (!cancelled && body.data) {
          setSharedResult(body.data)
          setOpen(true)
        }
      } catch {
        if (!cancelled && !streaming) {
          setError("Geteilter Kamerastream ist aktuell nicht erreichbar.")
        }
      }
    }

    void fetchSharedSnapshot()
    const interval = window.setInterval(fetchSharedSnapshot, SHARED_STREAM_POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [streaming])

  const lastScanTime = visibleResult
    ? new Date(visibleResult.capturedAt).toLocaleTimeString("de-DE")
    : null

  return (
    <Card className="border-primary/25">
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Stuhl-Erkennung mit geteiltem Kamerastream</CardTitle>
            <Badge variant="outline">COCO-SSD</Badge>
            <Badge variant={sharedResult ? "secondary" : "outline"}>
              {sharedResult ? "Stream sichtbar" : "Stream wartet"}
            </Badge>
          </div>
          <CardDescription>
            Das Handy scannt Stuehle live. Andere Browser sehen denselben
            Kamerasnapshot mit Boxen und bestaetigte Updates aktualisieren das
            Bau-Dashboard.
          </CardDescription>
        </div>
        <Button onClick={() => void startCamera()} disabled={startingCamera}>
          <Camera data-icon="inline-start" />
          {startingCamera ? "Kamera startet..." : "Handy-Kamera starten"}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Soll im System</p>
            <p className="mt-1 text-2xl font-semibold">
              {CHAIR_SYSTEM_TARGET} Stuehle
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Bestaetigter Bestand</p>
            <p className="mt-1 text-2xl font-semibold">
              {chairActualCount} Stuehle
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Scan-Durchschnitt</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-2xl font-semibold">
                {visibleResult ? visibleChairCount : "-"}
              </p>
              <Badge variant={visibleChairCount > 0 ? "secondary" : "outline"}>
                positive Ticks
              </Badge>
            </div>
          </div>
        </div>

        {chairDifference !== 0 ? (
          <div className="flex gap-2 rounded-lg border border-primary/25 bg-primary/5 p-4">
            <TriangleAlert className="mt-0.5 shrink-0" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                Abweichung erkannt: {chairDifference > 0 ? "+" : ""}
                {chairDifference} Stuehle gegenueber dem Sollbestand.
              </p>
              <p className="text-sm text-muted-foreground">
                Der bestaetigte Durchschnitt beruecksichtigt, dass nicht in jedem
                Frame alle Stuehle erkannt werden.
              </p>
            </div>
          </div>
        ) : null}

        {confirmedUpdate ? (
          <div className="rounded-lg border bg-secondary/50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Bestaetigt</Badge>
              <span className="text-sm text-muted-foreground">
                Stuhlbestand auf {confirmedUpdate.chairCount} gesetzt,{" "}
                {new Date(confirmedUpdate.capturedAt).toLocaleString("de-DE")}
              </span>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex flex-col gap-3">
            <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
              <video
                ref={videoRef}
                className={streaming ? "h-full w-full object-cover" : "hidden"}
                muted
                playsInline
              />
              {!streaming && sharedResult?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sharedResult.image}
                  alt="Geteilter Kamerastream"
                  className="h-full w-full object-cover"
                />
              ) : null}
              {visibleResult?.detections.map((detection) => (
                <div
                  key={detection.id}
                  className="absolute border-2 border-primary bg-primary/10"
                  style={{
                    left: `${detection.box.x}%`,
                    top: `${detection.box.y}%`,
                    width: `${detection.box.width}%`,
                    height: `${detection.box.height}%`,
                  }}
                >
                  <div className="max-w-full truncate bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                    {detection.label} {Math.round(detection.confidence * 100)}%
                  </div>
                </div>
              ))}
              {!streaming && !sharedResult?.image ? (
                <div className="absolute inset-0 grid place-items-center text-sm text-white/70">
                  <span className="inline-flex items-center gap-2">
                    <Video />
                    {startingCamera ? "Kamera startet" : "Kein geteilter Stream"}
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
              <Badge variant="outline">1 FPS Stuhl-Scan</Badge>
              <Badge variant="secondary">
                {modelStatus === "ready"
                  ? "Stuhlmodell bereit"
                  : modelStatus === "loading"
                    ? "Stuhlmodell laedt"
                    : modelStatus === "failed"
                      ? "Modellfehler"
                      : "Modell wartet"}
              </Badge>
              <Badge variant={latestDifference === 0 ? "secondary" : "default"}>
                {visibleResult
                  ? `${visibleChairCount}/${CHAIR_SYSTEM_TARGET} Stuehle im Durchschnitt`
                  : "Noch kein Scan"}
              </Badge>
              {lastScanTime ? <span>Letzter Tick {lastScanTime}</span> : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-base font-medium">
                Stuhlanzahl bestaetigen
              </h2>
              <p className="text-sm text-muted-foreground">
                Bestaetigt wird der Durchschnitt aller Scan-Ticks, in denen
                mindestens ein Stuhl erkannt wurde.
              </p>
            </div>

            <div className="rounded-lg border bg-secondary/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  Zu uebermitteln
                </span>
                <span className="text-xl font-semibold">
                  {visibleResult ? visibleChairCount : "-"} Stuehle
                </span>
              </div>
              {visibleResult ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Letzter Tick: {visibleResult.detected}, Differenz zum Soll:{" "}
                  {latestDifference > 0 ? "+" : ""}
                  {latestDifference}, Confidence{" "}
                  {Math.round(averageConfidence * 100)}%
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">Tracking pro Tick</p>
              <div className="mt-2 flex flex-col gap-2">
                {scanTicks.length > 0 ? (
                  scanTicks.map((tick) => (
                    <div
                      key={tick.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {new Date(tick.capturedAt).toLocaleTimeString("de-DE")}
                      </span>
                      <span className="font-medium">{tick.count} Stuehle</span>
                      <Badge variant="secondary">
                        {Math.round(tick.confidence * 100)}%
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Noch keine lokalen Erkennungsticks.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-auto flex flex-wrap justify-between gap-2">
              <Button variant="ghost" onClick={resetLocalScan}>
                <ClipboardCheck data-icon="inline-start" />
                Scan zuruecksetzen
              </Button>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => void inspectFrame()}
                  disabled={!streaming || scanning}
                >
                  <RefreshCw
                    data-icon="inline-start"
                    className={scanning ? "animate-spin" : undefined}
                  />
                  Tick scannen
                </Button>
                <Button variant="outline" onClick={rejectResult}>
                  <X data-icon="inline-start" />
                  Verwerfen
                </Button>
                <Button
                  onClick={() => void confirmResult()}
                  disabled={!canConfirm || confirming}
                >
                  <Check data-icon="inline-start" />
                  {confirming ? "Bestaetigt..." : "Update bestaetigen"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {!open ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ScanLine />
            <span>
              Starte die Kamera auf dem Handy. Diese Seite zeigt den Stream auch
              auf anderen Bildschirmen an.
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
