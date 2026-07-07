"use client"

import type {
  DetectedObject,
  ObjectDetection,
} from "@tensorflow-models/coco-ssd"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Armchair,
  Camera,
  Check,
  CircleAlert,
  ClipboardCheck,
  ImageIcon,
  RefreshCw,
  ScanLine,
  Smartphone,
  TriangleAlert,
  Video,
  X,
} from "lucide-react"

import type { VisionInspectResult } from "@workspace/domain/vision"
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
const CHAIR_STORAGE_KEY = "wbk-chair-showcase-actual"
const SCAN_INTERVAL_MS = 1200
const DEMO_FRAME_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NDAiIGhlaWdodD0iMzYwIiB2aWV3Qm94PSIwIDAgNjQwIDM2MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzE4MTgxYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5EZW1vLUJhdXN0ZWxsZW5zY2FuPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNTUlIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjYTNhM2EzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5PaG5lIGVjaHRlIEthbWVyYSAoTW9jay1Nb2R1cyk8L3RleHQ+PC9zdmc+"

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

interface VisionMaterialItem {
  id: string
  name: string
  einheit: string
  geliefert: number
  verbaut: number
  verbleibend: number
  status: string
  externeReferenz?: string
}

interface ConfirmedVisionUpdate {
  capturedAt: string
  detections: VisionInspectResult["detections"]
  aktivitaetId?: string
  chairCount: number
}

function isSecureCameraContext() {
  if (typeof window === "undefined") {
    return true
  }

  return (
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  )
}

function formatCameraError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Kamera konnte nicht gestartet werden."
  }

  if (
    error.name === "NotAllowedError" ||
    error.name === "PermissionDeniedError"
  ) {
    return "Kameraberechtigung wurde verweigert. Bitte in den Browser-Einstellungen erlauben und erneut starten."
  }

  if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
    return "Keine Kamera gefunden. Nutze den Demo-Scan ohne Kamera oder ein Handy mit Rueckkamera."
  }

  if (error.name === "NotReadableError" || error.name === "TrackStartError") {
    return "Kamera ist bereits von einer anderen App belegt oder nicht verfuegbar."
  }

  if (error.name === "OverconstrainedError") {
    return "Die angeforderte Kamera-Konfiguration wird von diesem Geraet nicht unterstuetzt."
  }

  if (error.name === "SecurityError" || !isSecureCameraContext()) {
    return "Kamera-APIs brauchen HTTPS oder localhost. Oeffne die App unter https:// oder http://localhost."
  }

  return error.message || "Kamera konnte nicht gestartet werden."
}

function boxFromCocoDetection(
  detection: DetectedObject,
  video: HTMLVideoElement
): VisionInspectResult["detections"][number]["box"] {
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
): VisionInspectResult {
  const chairDetections = detections
    .filter((detection) => detection.class === "chair")
    .sort((left, right) => right.score - left.score)
    .slice(0, 8)

  return {
    capturedAt: new Date().toISOString(),
    frameRate: 1,
    mode: "live",
    source: "coco-ssd-browser-chair-detector",
    summary: {
      expected: CHAIR_SYSTEM_TARGET,
      detected: chairDetections.length,
      matched: chairDetections.length,
      needsConfirmation: true,
    },
    detections: chairDetections.map((detection, index) => ({
      id: `chair-${index + 1}`,
      materialId: "stuhl-showcase",
      label: "Stuhl",
      confidence: Number(detection.score.toFixed(2)),
      box: boxFromCocoDetection(detection, video),
      systemMatch: {
        materialName: "Stuhl",
        externeReferenz: "ERP-ASSET-STUHL-001",
      },
      interpreted: {
        geliefert: CHAIR_SYSTEM_TARGET,
        verbaut: chairDetections.length,
        verbleibend: CHAIR_SYSTEM_TARGET - chairDetections.length,
        einheit: "stueck",
      },
    })),
  }
}

function buildSimulatedChairResult(count: number): VisionInspectResult {
  const detections = Array.from({ length: count }, (_, index) => ({
    id: `chair-simulation-${index + 1}`,
    materialId: "stuhl-showcase",
    label: "Stuhl",
    confidence: 0.91,
    box: {
      x: 12 + index * 28,
      y: 24,
      width: 22,
      height: 46,
    },
    systemMatch: {
      materialName: "Stuhl",
      externeReferenz: "ERP-ASSET-STUHL-001",
    },
    interpreted: {
      geliefert: CHAIR_SYSTEM_TARGET,
      verbaut: count,
      verbleibend: CHAIR_SYSTEM_TARGET - count,
      einheit: "stueck",
    },
  }))

  return {
    capturedAt: new Date().toISOString(),
    frameRate: 1,
    mode: "mock",
    source: "chair-showcase-simulation",
    summary: {
      expected: CHAIR_SYSTEM_TARGET,
      detected: count,
      matched: count,
      needsConfirmation: true,
    },
    detections,
  }
}

export function VisionCameraPanel({
  projectId,
  materialien,
}: {
  projectId: string
  materialien: VisionMaterialItem[]
}) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const chairModelRef = useRef<ObjectDetection | null>(null)

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"camera" | "demo" | "upload" | "chair-sim">(
    "camera"
  )
  const [streaming, setStreaming] = useState(false)
  const [startingCamera, setStartingCamera] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [modelStatus, setModelStatus] = useState<
    "idle" | "loading" | "ready" | "failed"
  >("idle")
  const [error, setError] = useState<string | null>(null)
  const [latestResult, setLatestResult] = useState<VisionInspectResult | null>(
    null
  )
  const [confirmedUpdate, setConfirmedUpdate] =
    useState<ConfirmedVisionUpdate | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [chairActualCount, setChairActualCount] = useState(getInitialChairCount)

  const expectedItems = useMemo(
    () =>
      materialien.map((item) => ({
        id: item.id,
        name: item.name,
        einheit: item.einheit,
        geliefert: item.geliefert,
        verbaut: item.verbaut,
        verbleibend: item.verbleibend,
        externeReferenz: item.externeReferenz,
      })),
    [materialien]
  )

  const chairDifference = chairActualCount - CHAIR_SYSTEM_TARGET
  const latestChairCount = latestResult?.summary.detected ?? 0
  const latestDifference = latestChairCount - CHAIR_SYSTEM_TARGET
  const usingLiveChairDetector =
    latestResult?.source === "coco-ssd-browser-chair-detector"

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
        "Stuhl-Erkennungsmodell konnte nicht geladen werden. Nutze den Simulationsbutton oder pruefe die Netzwerkverbindung."
      )

      return null
    }
  }, [])

  const inspectImage = useCallback(
    async (imageDataUrl: string) => {
      if (scanning) {
        return
      }

      setScanning(true)

      try {
        const response = await fetch("/api/vision/inspect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: imageDataUrl,
            expectedItems,
            useStableMock: true,
          }),
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string
          } | null
          throw new Error(
            payload?.error ??
              "Vision-Backend konnte den Frame nicht verarbeiten."
          )
        }

        const result = (await response.json()) as VisionInspectResult
        setLatestResult(result)
        setError(null)
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Vision-Scan ist fehlgeschlagen."
        )
      } finally {
        setScanning(false)
      }
    },
    [expectedItems, scanning]
  )

  const inspectFrame = useCallback(async () => {
    if (scanning) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      return
    }

    canvas.width = 480
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 480)
    const context = canvas.getContext("2d")
    context?.drawImage(video, 0, 0, canvas.width, canvas.height)

    setScanning(true)

    try {
      const model = await loadChairModel()

      if (model) {
        const detections = await model.detect(video, 12, 0.45)
        setLatestResult(buildChairResult(detections, video))
        setError(null)
        return
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Vision-Scan ist fehlgeschlagen."
      )
      return
    } finally {
      setScanning(false)
    }

    await inspectImage(canvas.toDataURL("image/jpeg", 0.58))
  }, [inspectImage, loadChairModel, scanning])

  const startScanInterval = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
    }

    void loadChairModel()
    window.setTimeout(() => void inspectFrame(), 700)
    intervalRef.current = window.setInterval(() => {
      void inspectFrame()
    }, SCAN_INTERVAL_MS)
  }, [inspectFrame, loadChairModel])

  async function startCamera() {
    setOpen(true)
    setMode("camera")
    setPreviewImage(null)
    setError(null)
    setLatestResult(null)
    setStartingCamera(true)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Dieser Browser erlaubt keinen direkten Kamerazugriff. Nutze den Demo-Scan ohne Kamera."
      )
      setStartingCamera(false)
      return
    }

    if (!isSecureCameraContext()) {
      setError(
        "Kamera-APIs brauchen HTTPS oder localhost. Nutze https://, http://localhost oder den Demo-Scan ohne Kamera."
      )
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
      startScanInterval()
    } catch (cameraError) {
      setError(formatCameraError(cameraError))
    } finally {
      setStartingCamera(false)
    }
  }

  async function startDemoWithoutCamera() {
    stopCamera()
    setOpen(true)
    setMode("demo")
    setPreviewImage(DEMO_FRAME_DATA_URL)
    setError(null)
    setLatestResult(null)
    await inspectImage(DEMO_FRAME_DATA_URL)
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    stopCamera()
    setOpen(true)
    setMode("upload")
    setError(null)
    setLatestResult(null)

    const reader = new FileReader()

    reader.onload = async () => {
      const dataUrl =
        typeof reader.result === "string" ? reader.result : DEMO_FRAME_DATA_URL
      setPreviewImage(dataUrl)
      await inspectImage(dataUrl)
    }

    reader.onerror = () => {
      setError("Bild konnte nicht gelesen werden.")
    }

    reader.readAsDataURL(file)
    event.target.value = ""
  }

  function closeCamera() {
    stopCamera()
    setOpen(false)
    setLatestResult(null)
    setPreviewImage(null)
    setMode("camera")
  }

  function rejectResult() {
    closeCamera()
  }

  function resetChairShowcase() {
    setChairActualCount(CHAIR_SYSTEM_TARGET)
    window.localStorage.setItem(CHAIR_STORAGE_KEY, String(CHAIR_SYSTEM_TARGET))
    setConfirmedUpdate(null)
    setLatestResult(null)
  }

  function simulateTwoChairs() {
    stopCamera()
    setOpen(true)
    setMode("chair-sim")
    setPreviewImage(null)
    setError(null)
    setLatestResult(buildSimulatedChairResult(2))
  }

  async function confirmResult() {
    if (!latestResult || latestResult.detections.length === 0 || confirming) {
      return
    }

    const nextChairCount = latestResult.summary.detected

    setConfirming(true)
    setError(null)

    try {
      const response = await fetch("/api/vision/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          capturedAt: latestResult.capturedAt,
          detections: latestResult.detections,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: { message?: string }
        }
        throw new Error(
          payload.error?.message ??
            "Vision-Ergebnis konnte nicht im System gespeichert werden."
        )
      }

      const payload = (await response.json()) as {
        data: { aktivitaetId: string }
      }

      setChairActualCount(nextChairCount)
      window.localStorage.setItem(CHAIR_STORAGE_KEY, String(nextChairCount))
      setConfirmedUpdate({
        capturedAt: latestResult.capturedAt,
        detections: latestResult.detections,
        aktivitaetId: payload.data.aktivitaetId,
        chairCount: nextChairCount,
      })
      closeCamera()
      router.refresh()
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Vision-Ergebnis konnte nicht bestaetigt werden."
      )
    } finally {
      setConfirming(false)
    }
  }

  useEffect(() => stopCamera, [stopCamera])

  const lastScanTime = latestResult
    ? new Date(latestResult.capturedAt).toLocaleTimeString("de-DE")
    : null

  const showVideo = mode === "camera"
  const showStaticPreview = mode === "demo" || mode === "upload"
  const showChairSimulation = mode === "chair-sim"

  return (
    <Card className="border-primary/25">
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Stuhl-Showcase mit Kamera/Vision</CardTitle>
            <Badge variant="outline">
              {usingLiveChairDetector ? "COCO-SSD" : "Mock-Vision"}
            </Badge>
          </div>
          <CardDescription>
            Sollbestand 3 Stuehle, Live-Erkennung per Handy-Kamera und
            Bestaetigung vor dem automatischen Systemupdate.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={simulateTwoChairs}>
            <Armchair />
            2 Stuehle simulieren
          </Button>
          <Button onClick={() => void startCamera()}>
            <Camera />
            Kamera-Modus starten
          </Button>
          <Button variant="outline" onClick={() => void startDemoWithoutCamera()}>
            <ImageIcon />
            Demo-Scan ohne Kamera
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Smartphone />
            Bild hochladen
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleFileUpload(event)}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-xl border border-dashed bg-secondary/30 p-3 text-sm text-muted-foreground">
          <p>
            Fuer Handy-Tests: App unter{" "}
            <span className="font-mono">https://</span> oder{" "}
            <span className="font-mono">localhost</span> oeffnen, Kamera
            erlauben, Scan starten und Ergebnis bestaetigen. Details in{" "}
            <span className="font-medium text-foreground">docs/vision-demo.md</span>
            .
          </p>
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
              <Badge variant="secondary">Bestaetigt und gespeichert</Badge>
              <Badge variant="outline">
                {usingLiveChairDetector ? "COCO-SSD" : "Mock-Vision"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Systembestand auf {confirmedUpdate.chairCount} Stuehle gesetzt,{" "}
                {new Date(confirmedUpdate.capturedAt).toLocaleString("de-DE")}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Materialtabelle, ERP/EAP-Sync und Aktivitaetslog wurden aktualisiert.
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {confirmedUpdate.detections.map((detection) => (
                <div key={detection.id} className="rounded-xl border bg-card p-3">
                  <p className="font-medium">{detection.label}</p>
                  <p className="text-sm text-muted-foreground">
                    Confidence {Math.round(detection.confidence * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Quelle: Kamera/Vision {"->"} ERP/EAP-Abgleich
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {open ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-3">
              <div className="relative aspect-video overflow-hidden rounded-2xl border bg-black">
                {showVideo ? (
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />
                ) : null}
                {showStaticPreview && previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewImage}
                    alt="Demo-Vorschau fuer Vision-Scan"
                    className="h-full w-full object-cover"
                  />
                ) : null}
                <canvas ref={canvasRef} className="hidden" />
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
                      {detection.label} {Math.round(detection.confidence * 100)}
                      %
                    </div>
                  </div>
                ))}
                {showVideo && !streaming ? (
                  <div className="absolute inset-0 grid place-items-center text-sm text-white/70">
                    <span className="inline-flex items-center gap-2">
                      <Video className="size-4" />
                      {startingCamera
                        ? "Kameraberechtigung wird angefragt..."
                        : "Kamera wartet"}
                    </span>
                  </div>
                ) : null}
                {showStaticPreview ? (
                  <div className="absolute left-3 top-3">
                    <Badge variant="secondary">
                      {mode === "demo" ? "Desktop-Demo" : "Upload-Demo"}
                    </Badge>
                  </div>
                ) : null}
                {showChairSimulation ? (
                  <div className="absolute left-3 top-3">
                    <Badge variant="secondary">Stuhl-Simulation</Badge>
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
                <Badge variant="outline">
                  {usingLiveChairDetector ? "COCO-SSD" : "Mock-Vision"}
                </Badge>
                <Badge variant="outline">
                  {Math.round(1000 / SCAN_INTERVAL_MS)} FPS Demo-Scan
                </Badge>
                <Badge variant="secondary">
                  {modelStatus === "ready"
                    ? "Stuhlmodell bereit"
                    : modelStatus === "loading"
                      ? "Stuhlmodell laedt"
                      : modelStatus === "failed"
                        ? "Fallback aktiv"
                        : "Modell wartet"}
                </Badge>
                <Badge variant={latestDifference === 0 ? "secondary" : "default"}>
                  {latestResult
                    ? `${latestChairCount}/${CHAIR_SYSTEM_TARGET} Stuehle erkannt`
                    : "Noch kein Frame"}
                </Badge>
                {lastScanTime ? <span>Letzter Scan {lastScanTime}</span> : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border p-4">
              <div className="space-y-1">
                <h2 className="font-heading text-base font-medium">
                  Stimmen die erkannten Stuehle?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Wenn du bestaetigst, wird der Istbestand automatisch auf die
                  erkannte Anzahl gesetzt und im System gespeichert.
                </p>
              </div>

              <div className="rounded-xl border bg-secondary/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    Kamera erkennt
                  </span>
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

              <div className="flex max-h-80 flex-col gap-2 overflow-auto pr-1">
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
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {detection.systemMatch.externeReferenz}
                    </p>
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
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (mode === "camera") {
                        void inspectFrame()
                        return
                      }

                      if (previewImage) {
                        void inspectImage(previewImage)
                      }
                    }}
                    disabled={
                      scanning ||
                      confirming ||
                      (mode === "camera"
                        ? !streaming
                        : mode === "chair-sim"
                          ? false
                          : previewImage === null)
                    }
                  >
                    <RefreshCw className={scanning ? "animate-spin" : ""} />
                    Frame scannen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={rejectResult}
                    disabled={confirming}
                  >
                    <X />
                    Ablehnen
                  </Button>
                  <Button
                    onClick={() => void confirmResult()}
                    disabled={
                      !latestResult ||
                      latestResult.detections.length === 0 ||
                      confirming
                    }
                  >
                    <Check />
                    {confirming ? "Speichern..." : "Update bestaetigen"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ScanLine className="size-4" />
            <span>
              Showcase bereit: drei Stuehle im System, Kamera erkennt den
              aktuellen Istzustand und fragt vor dem Update nach.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
