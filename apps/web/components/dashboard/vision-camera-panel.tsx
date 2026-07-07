"use client"

import type {
  DetectedObject,
  ObjectDetection,
} from "@tensorflow-models/coco-ssd"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Armchair,
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

import { formatCameraError } from "@/lib/camera/format-camera-error"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

const CHAIR_SYSTEM_TARGET = 3
const CHAIR_STORAGE_KEY = "wbk-chair-showcase-actual"
const SCAN_INTERVAL_MS = 1200

function getInitialChairCount() {
  if (typeof window === "undefined") {
    return CHAIR_SYSTEM_TARGET
  }

  const storedCount = window.localStorage.getItem(CHAIR_STORAGE_KEY)

  if (!storedCount) {
    return CHAIR_SYSTEM_TARGET
  }

  const parsedCount = Number(storedCount)

  return Number.isFinite(parsedCount) ? parsedCount : CHAIR_SYSTEM_TARGET
}

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
  detections: ChairDetection[]
  source: "coco-ssd-chair-detector" | "chair-simulation"
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

function buildChairResult(
  detections: DetectedObject[],
  video: HTMLVideoElement
): ChairScanResult {
  const chairDetections = detections
    .filter((detection) => detection.class === "chair")
    .sort((left, right) => right.score - left.score)
    .slice(0, 8)

  return {
    capturedAt: new Date().toISOString(),
    detected: chairDetections.length,
    source: "coco-ssd-chair-detector",
    detections: chairDetections.map((detection, index) => ({
      id: `chair-${index + 1}`,
      label: "Stuhl",
      confidence: Number(detection.score.toFixed(2)),
      box: boxFromCocoDetection(detection, video),
    })),
  }
}

function buildSimulatedChairResult(count: number): ChairScanResult {
  return {
    capturedAt: new Date().toISOString(),
    detected: count,
    source: "chair-simulation",
    detections: Array.from({ length: count }, (_, index) => ({
      id: `chair-simulation-${index + 1}`,
      label: "Stuhl",
      confidence: 0.91,
      box: {
        x: 12 + index * 28,
        y: 24,
        width: 22,
        height: 46,
      },
    })),
  }
}

function drawPixelatedFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  blockSize = 14
) {
  const width = 480
  const height = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * width))
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")

  if (!context) {
    return
  }

  const small = document.createElement("canvas")
  small.width = Math.max(1, Math.floor(width / blockSize))
  small.height = Math.max(1, Math.floor(height / blockSize))

  const smallContext = small.getContext("2d")

  if (!smallContext) {
    context.drawImage(video, 0, 0, width, height)
    return
  }

  smallContext.drawImage(video, 0, 0, small.width, small.height)
  context.imageSmoothingEnabled = false
  context.drawImage(small, 0, 0, width, height)
}

interface VisionCameraPanelProps {
  variant?: "dashboard" | "compact"
}

export function VisionCameraPanel({
  variant = "dashboard",
}: VisionCameraPanelProps) {
  const isMobile = useIsMobile()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const privacyCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const intervalRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chairModelRef = useRef<ObjectDetection | null>(null)

  const [open, setOpen] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [startingCamera, setStartingCamera] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [modelStatus, setModelStatus] = useState<
    "idle" | "loading" | "ready" | "failed"
  >("idle")
  const [error, setError] = useState<string | null>(null)
  const [latestResult, setLatestResult] = useState<ChairScanResult | null>(null)
  const [confirmedUpdate, setConfirmedUpdate] =
    useState<ConfirmedChairUpdate | null>(null)
  const [chairActualCount, setChairActualCount] = useState(getInitialChairCount)
  const [pixelateFaces, setPixelateFaces] = useState(true)
  const [scanTicks, setScanTicks] = useState<ChairScanTick[]>([])

  const chairDifference = chairActualCount - CHAIR_SYSTEM_TARGET
  const latestChairCount = latestResult?.detected ?? 0
  const latestDifference = latestChairCount - CHAIR_SYSTEM_TARGET

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
      setError(
        "Stuhl-Erkennungsmodell konnte nicht geladen werden. Es werden keine anderen Klassen erkannt."
      )

      return null
    }
  }, [])

  function applyResultTick(result: ChairScanResult) {
    const averageConfidence =
      result.detections.length > 0
        ? result.detections.reduce(
            (sum, detection) => sum + detection.confidence,
            0
          ) / result.detections.length
        : 0

    setLatestResult(result)
    setScanTicks((previousTicks) =>
      [
        {
          id: result.capturedAt,
          capturedAt: result.capturedAt,
          count: result.detected,
          confidence: averageConfidence,
        },
        ...previousTicks,
      ].slice(0, 6)
    )
  }

  const inspectFrame = useCallback(async () => {
    const video = videoRef.current

    if (!video || scanning || !video.videoWidth || !video.videoHeight) {
      return
    }

    setScanning(true)

    try {
      const model = await loadChairModel()

      if (!model) {
        setError(
          "Stuhl-Erkennungsmodell ist nicht bereit. Es werden keine anderen Objektklassen als Stuehle verwendet."
        )
        return
      }

      const detections = await model.detect(video, 12, 0.45)
      applyResultTick(buildChairResult(detections, video))
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
  }, [loadChairModel, scanning])

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
      window.setTimeout(() => void inspectFrame(), 700)
      intervalRef.current = window.setInterval(() => {
        void inspectFrame()
      }, SCAN_INTERVAL_MS)
    } catch (cameraError) {
      setError(formatCameraError(cameraError))
    } finally {
      setStartingCamera(false)
    }
  }

  function closeCamera() {
    stopCamera()
    setOpen(false)
  }

  function handleCaptureOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      closeCamera()
      return
    }

    setOpen(true)
  }

  function confirmResult() {
    if (!latestResult) {
      return
    }

    const nextChairCount = latestResult.detected

    setChairActualCount(nextChairCount)
    window.localStorage.setItem(CHAIR_STORAGE_KEY, String(nextChairCount))
    setConfirmedUpdate({
      capturedAt: latestResult.capturedAt,
      detections: latestResult.detections,
      chairCount: nextChairCount,
    })
    closeCamera()
  }

  function rejectResult() {
    setLatestResult(null)
    setError("Erkennung verworfen. Der Systembestand wurde nicht geaendert.")
  }

  function resetChairShowcase() {
    setChairActualCount(CHAIR_SYSTEM_TARGET)
    window.localStorage.setItem(CHAIR_STORAGE_KEY, String(CHAIR_SYSTEM_TARGET))
    setConfirmedUpdate(null)
    setLatestResult(null)
    setScanTicks([])
    setError(null)
  }

  function simulateTwoChairs() {
    setOpen(true)
    setError(null)
    applyResultTick(buildSimulatedChairResult(2))
  }

  useEffect(() => stopCamera, [stopCamera])

  useEffect(() => {
    if (!open || !streaming || !pixelateFaces) {
      return
    }

    let frameId = 0

    const renderPrivacyFrame = () => {
      const video = videoRef.current
      const canvas = privacyCanvasRef.current

      if (video && canvas && video.videoWidth > 0 && video.videoHeight > 0) {
        drawPixelatedFrame(video, canvas)
      }

      frameId = window.requestAnimationFrame(renderPrivacyFrame)
    }

    frameId = window.requestAnimationFrame(renderPrivacyFrame)

    return () => window.cancelAnimationFrame(frameId)
  }, [open, pixelateFaces, streaming])

  const lastScanTime = latestResult
    ? new Date(latestResult.capturedAt).toLocaleTimeString("de-DE")
    : null

  const capturePanel = open ? (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-3">
        <div className="relative aspect-video overflow-hidden rounded-2xl border bg-black">
          <video
            ref={videoRef}
            className={
              pixelateFaces && streaming
                ? "absolute size-0 opacity-0"
                : "h-full w-full object-cover"
            }
            muted
            playsInline
          />
          {pixelateFaces && streaming ? (
            <canvas
              ref={privacyCanvasRef}
              className="h-full w-full object-cover"
            />
          ) : null}
          {latestResult?.detections.map((detection) => (
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
          {!streaming && latestResult?.source !== "chair-simulation" ? (
            <div className="absolute inset-0 grid place-items-center text-sm text-white/70">
              <span className="inline-flex items-center gap-2">
                <Video className="size-4" />
                {startingCamera ? "Kamera startet" : "Kamera wartet"}
              </span>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
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
                  ? "Keine Fremdklassen"
                  : "Modell wartet"}
          </Badge>
          <Badge variant={latestDifference === 0 ? "secondary" : "default"}>
            {latestResult
              ? `${latestChairCount}/${CHAIR_SYSTEM_TARGET} Stuehle erkannt`
              : "Noch kein Tick"}
          </Badge>
          {lastScanTime ? <span>Letzter Tick {lastScanTime}</span> : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border p-4">
        <div className="space-y-1">
          <h2 className="font-heading text-base font-medium">
            Stimmen die erkannten Stuehle?
          </h2>
          <p className="text-sm text-muted-foreground">
            Wenn du bestaetigst, wird der Istbestand automatisch auf die
            erkannte Anzahl gesetzt.
          </p>
        </div>

        <div className="rounded-xl border bg-secondary/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">Kamera erkennt</span>
            <span className="text-xl font-semibold">
              {latestResult ? latestChairCount : "-"} Stuehle
            </span>
          </div>
          {latestResult ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Soll: {CHAIR_SYSTEM_TARGET}, Differenz:{" "}
              {latestDifference > 0 ? "+" : ""}
              {latestDifference}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border p-3">
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
                Noch keine Erkennungsticks.
              </p>
            )}
          </div>
        </div>

        <div className="flex max-h-56 flex-col gap-2 overflow-auto pr-1">
          {latestResult?.detections.map((detection) => (
            <div key={detection.id} className="rounded-xl border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium">{detection.label}</p>
                <Badge
                  variant={
                    detection.confidence >= 0.75 ? "default" : "secondary"
                  }
                >
                  {Math.round(detection.confidence * 100)}%
                </Badge>
              </div>
            </div>
          )) ?? (
            <p className="text-sm text-muted-foreground">
              Starte die Kamera und filme die Stuehle im Raum.
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap justify-between gap-2">
          <Button variant="ghost" onClick={resetChairShowcase}>
            <ClipboardCheck />
            Auf 3 zuruecksetzen
          </Button>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={closeCamera}>
              <X />
              Schliessen
            </Button>
            <Button
              variant="ghost"
              onClick={() => void inspectFrame()}
              disabled={!streaming || scanning}
            >
              <RefreshCw className={scanning ? "animate-spin" : ""} />
              Tick scannen
            </Button>
            <Button variant="outline" onClick={rejectResult}>
              <X />
              Verwerfen
            </Button>
            <Button onClick={confirmResult} disabled={!latestResult}>
              <Check />
              Update bestaetigen
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : null

  if (variant === "compact") {
    return (
      <Card className="border-primary/25">
        <CardHeader className="gap-2">
          <CardTitle className="text-base">Kamera-Update</CardTitle>
          <CardDescription>
            Baustellen-Scan per Handy-Kamera starten. Rueckkamera wird
            bevorzugt.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            className="h-12 w-full text-base"
            onClick={() => void startCamera()}
            disabled={startingCamera}
          >
            <Camera />
            {startingCamera ? "Kamera startet..." : "Kamera-Update starten"}
          </Button>
          {error && !open ? (
            <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </CardContent>

        <Sheet open={open} onOpenChange={handleCaptureOpenChange}>
          <SheetContent
            side="bottom"
            className="h-[min(92dvh,100%)] overflow-y-auto p-4"
          >
            <SheetHeader className="p-0 pb-3">
              <SheetTitle>Kamera-Update</SheetTitle>
              <SheetDescription>
                Livebild fuer den Inventar-Scan. Schliesse das Panel, um die
                Kamera zu beenden.
              </SheetDescription>
            </SheetHeader>
            {capturePanel}
          </SheetContent>
        </Sheet>
      </Card>
    )
  }

  return (
    <Card className="border-primary/25" data-tour="bau-kamera">
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Vision-Update fuer ERP/EAP</CardTitle>
            <Badge variant="outline">Kamera-Scan</Badge>
          </div>
          <CardDescription>
            Inventar- und Baustellen-Scan per Handy-Kamera. Sollbestand 3
            Stuehle (Showcase), Bestaetigung vor dem Systemupdate.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={simulateTwoChairs}>
            <Armchair />
            2 Stuehle simulieren
          </Button>
          <Button onClick={() => void startCamera()} disabled={startingCamera}>
            <Camera />
            {startingCamera ? "Kamera startet..." : "Kamera-Update starten"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-xl border border-dashed bg-secondary/30 p-3 text-sm text-muted-foreground">
          <p>
            Live-Erkennung laeuft lokal im Browser. Aktiviere die Verpixelung,
            damit Gesichter im Kamerabild nicht sichtbar sind.
          </p>
          <div className="flex items-center gap-3">
            <Switch
              id="vision-privacy-pixelate"
              checked={pixelateFaces}
              onCheckedChange={setPixelateFaces}
            />
            <Label htmlFor="vision-privacy-pixelate">
              Gesichter verpixeln (Datenschutz)
            </Label>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border p-4">
            <p className="text-sm text-muted-foreground">Soll im System</p>
            <p className="mt-1 text-2xl font-semibold">
              {CHAIR_SYSTEM_TARGET} Stuehle
            </p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-sm text-muted-foreground">Ist nach Update</p>
            <p className="mt-1 text-2xl font-semibold">
              {chairActualCount} Stuehle
            </p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-sm text-muted-foreground">Diskrepanz</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-2xl font-semibold">
                {chairDifference > 0 ? "+" : ""}
                {chairDifference}
              </p>
              {chairDifference === 0 ? (
                <Badge variant="secondary">Soll = Ist</Badge>
              ) : (
                <Badge variant="default">Massnahme offen</Badge>
              )}
            </div>
          </div>
        </div>

        {chairDifference !== 0 ? (
          <div className="flex gap-2 rounded-2xl border border-primary/25 bg-primary/5 p-4">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Abweichung erkannt: Es fehlen{" "}
                {Math.abs(chairDifference)} Stuehle gegenueber dem Sollbestand.
              </p>
              <p className="text-sm text-muted-foreground">
                Der Massnahmenbereich ist vorbereitet. Die konkrete Massnahme
                kannst du spaeter definieren.
              </p>
            </div>
          </div>
        ) : null}

        {confirmedUpdate ? (
          <div className="rounded-2xl border bg-secondary/50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Bestaetigt</Badge>
              <span className="text-sm text-muted-foreground">
                Systembestand auf {confirmedUpdate.chairCount} Stuehle gesetzt,{" "}
                {new Date(confirmedUpdate.capturedAt).toLocaleString("de-DE")}
              </span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {confirmedUpdate.detections.map((detection) => (
                <div key={detection.id} className="rounded-xl border bg-card p-3">
                  <p className="font-medium">{detection.label}</p>
                  <p className="text-sm text-muted-foreground">
                    Confidence {Math.round(detection.confidence * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Quelle: Kamera/Vision {"->"} Stuhlbestand
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {open && isMobile ? (
          <Sheet open={open} onOpenChange={handleCaptureOpenChange}>
            <SheetContent
              side="bottom"
              className="h-[min(92dvh,100%)] overflow-y-auto p-4"
            >
              <SheetHeader className="p-0 pb-3">
                <SheetTitle>Kamera-Update</SheetTitle>
                <SheetDescription>
                  Livebild fuer den Inventar-Scan. Schliesse das Panel, um die
                  Kamera zu beenden.
                </SheetDescription>
              </SheetHeader>
              {capturePanel}
            </SheetContent>
          </Sheet>
        ) : open ? (
          capturePanel
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ScanLine className="size-4" />
            <span>
              Kamera-Update bereit: Starte den Scan neben den ERP-/Materialwerten
              oder simuliere einen Demo-Tick ohne Kamera.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
