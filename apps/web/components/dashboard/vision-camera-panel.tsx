"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import {
  Camera,
  Check,
  CircleAlert,
  MonitorPlay,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Video,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { bestaetigeVisionUpdateAction } from "@/lib/actions/vision-actions"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

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

interface DetectionBox {
  x: number
  y: number
  width: number
  height: number
}

interface VisionDetection {
  id: string
  materialId: string
  label: string
  confidence: number
  box: DetectionBox
  systemMatch: {
    materialName: string
    externeReferenz?: string
  }
  interpreted: {
    geliefert: number
    verbaut: number
    verbleibend: number
    einheit: string
  }
}

interface VisionResponse {
  capturedAt: string
  frameRate: number
  source: string
  summary: {
    expected: number
    detected: number
    matched: number
    needsConfirmation: boolean
  }
  detections: VisionDetection[]
}

interface ConfirmedVisionUpdate {
  capturedAt: string
  detections: VisionDetection[]
}

/** Grobes Mosaik über den gesamten Frame (Demo-grade Verpixelung, #94). */
function pixelateCanvas(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  block: number
) {
  const smallW = Math.max(1, Math.floor(width / block))
  const smallH = Math.max(1, Math.floor(height / block))
  const temp = document.createElement("canvas")
  temp.width = smallW
  temp.height = smallH
  const tempContext = temp.getContext("2d")
  if (!tempContext) {
    return
  }
  tempContext.drawImage(context.canvas, 0, 0, smallW, smallH)
  context.imageSmoothingEnabled = false
  context.drawImage(temp, 0, 0, smallW, smallH, 0, 0, width, height)
  context.imageSmoothingEnabled = true
}

export function VisionCameraPanel({
  materialien,
}: {
  materialien: VisionMaterialItem[]
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<number | null>(null)

  const [open, setOpen] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestResult, setLatestResult] = useState<VisionResponse | null>(null)
  const [confirmedUpdate, setConfirmedUpdate] =
    useState<ConfirmedVisionUpdate | null>(null)
  const [datenschutz, setDatenschutz] = useState(true)
  const [pending, startTransition] = useTransition()

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

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStreaming(false)
  }, [])

  const inspectFrame = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || scanning || !video.videoWidth || !video.videoHeight) {
      return
    }

    setScanning(true)

    canvas.width = 480
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 480)
    const context = canvas.getContext("2d")
    context?.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Datenschutz (#94): Frame vor dem Upload verpixeln, damit Gesichter und
    // personenbezogene Details nicht übertragen werden (Demo-grade Mosaik).
    if (context && datenschutz) {
      pixelateCanvas(context, canvas.width, canvas.height, 12)
    }

    try {
      const response = await fetch("/api/vision/inspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: canvas.toDataURL("image/jpeg", 0.58),
          expectedItems,
        }),
      })

      if (!response.ok) {
        throw new Error("Vision-Backend konnte den Frame nicht verarbeiten.")
      }

      const result = (await response.json()) as VisionResponse
      setLatestResult(result)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Vision-Scan ist fehlgeschlagen."
      )
    } finally {
      setScanning(false)
    }
  }, [expectedItems, scanning, datenschutz])

  const runDemoScan = useCallback(async () => {
    setOpen(true)
    setError(null)
    setScanning(true)
    try {
      const response = await fetch("/api/vision/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedItems }),
      })
      if (!response.ok) {
        throw new Error("Demo-Scan konnte nicht geladen werden.")
      }
      setLatestResult((await response.json()) as VisionResponse)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Demo-Scan ist fehlgeschlagen."
      )
    } finally {
      setScanning(false)
    }
  }, [expectedItems])

  async function startCamera() {
    setOpen(true)
    setError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Dieser Browser erlaubt keinen direkten Kamerazugriff.")
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
      window.setTimeout(() => void inspectFrame(), 500)
      intervalRef.current = window.setInterval(() => {
        void inspectFrame()
      }, 1200)
    } catch (cameraError) {
      setError(
        cameraError instanceof Error
          ? cameraError.message
          : "Kamera konnte nicht gestartet werden."
      )
    }
  }

  function closeCamera() {
    stopCamera()
    setOpen(false)
  }

  function confirmResult() {
    if (!latestResult || latestResult.detections.length === 0) {
      return
    }

    const snapshot = latestResult
    const updates = snapshot.detections.map((detection) => ({
      materialId: detection.materialId,
      verbaut: detection.interpreted.verbaut,
      verbleibend: detection.interpreted.verbleibend,
    }))

    startTransition(async () => {
      try {
        await bestaetigeVisionUpdateAction(updates)
        setConfirmedUpdate({
          capturedAt: snapshot.capturedAt,
          detections: snapshot.detections,
        })
        toast.success("Kamera-Update in den Materialbestand übernommen.")
        closeCamera()
      } catch (updateError) {
        toast.error(
          updateError instanceof Error
            ? updateError.message
            : "Update konnte nicht übernommen werden."
        )
      }
    })
  }

  useEffect(() => stopCamera, [stopCamera])

  const lastScanTime = latestResult
    ? new Date(latestResult.capturedAt).toLocaleTimeString("de-DE")
    : null

  return (
    <Card className="border-primary/25">
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <CardTitle>Vision-Update fuer ERP/EAP</CardTitle>
          <CardDescription>
            Kamera-Scan mit Live-Erkennung, Systemabgleich und Bestaetigung vor
            dem Dashboard-Update.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void startCamera()}>
            <Camera />
            Kamera-Update starten
          </Button>
          <Button variant="outline" onClick={() => void runDemoScan()}>
            <MonitorPlay />
            Demo-Modus (ohne Kamera)
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {confirmedUpdate ? (
          <div className="rounded-2xl border bg-secondary/50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Bestaetigt</Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(confirmedUpdate.capturedAt).toLocaleString("de-DE")}
              </span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {confirmedUpdate.detections.map((detection) => (
                <div key={detection.id} className="rounded-xl border bg-card p-3">
                  <p className="font-medium">{detection.label}</p>
                  <p className="text-sm text-muted-foreground">
                    Verbaut erkannt: {detection.interpreted.verbaut}{" "}
                    {detection.interpreted.einheit}
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
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                />
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
                {!streaming ? (
                  <div className="absolute inset-0 grid place-items-center text-sm text-white/70">
                    <span className="inline-flex items-center gap-2">
                      <Video className="size-4" />
                      Kamera wartet
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
                <Badge variant="outline">1 FPS Demo-Scan</Badge>
                <Badge variant="secondary">
                  {latestResult
                    ? `${latestResult.summary.matched}/${latestResult.summary.expected} Treffer`
                    : "Noch kein Frame"}
                </Badge>
                {lastScanTime ? <span>Letzter Scan {lastScanTime}</span> : null}
                <label className="ml-auto inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={datenschutz}
                    onChange={(event) => setDatenschutz(event.target.checked)}
                    className="size-4"
                  />
                  <ShieldCheck className="size-4" />
                  Gesichter verpixeln
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border p-4">
              <div className="space-y-1">
                <h2 className="font-heading text-base font-medium">
                  Stimmen die erkannten Sachen?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Erst nach Bestaetigung wird der Kamera-Stand als ERP/EAP-Update
                  in der Demo angezeigt.
                </p>
              </div>

              <div className="flex max-h-80 flex-col gap-2 overflow-auto pr-1">
                {latestResult?.detections.map((detection) => (
                  <div key={detection.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{detection.label}</p>
                      <Badge
                        variant={
                          detection.confidence >= 0.8 ? "default" : "secondary"
                        }
                      >
                        {Math.round(detection.confidence * 100)}%
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Verbaut: {detection.interpreted.verbaut}{" "}
                      {detection.interpreted.einheit}, verbleibend{" "}
                      {detection.interpreted.verbleibend}{" "}
                      {detection.interpreted.einheit}
                    </p>
                    {detection.systemMatch.externeReferenz ? (
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {detection.systemMatch.externeReferenz}
                      </p>
                    ) : null}
                  </div>
                )) ?? (
                  <p className="text-sm text-muted-foreground">
                    Starte die Kamera, um Materialpositionen zu erkennen.
                  </p>
                )}
              </div>

              <div className="mt-auto flex flex-wrap justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => void inspectFrame()}
                  disabled={!streaming || scanning}
                >
                  <RefreshCw className={scanning ? "animate-spin" : ""} />
                  Frame scannen
                </Button>
                <Button variant="outline" onClick={closeCamera}>
                  <X />
                  Abbrechen
                </Button>
                <Button
                  onClick={confirmResult}
                  disabled={
                    pending ||
                    !latestResult ||
                    latestResult.detections.length === 0
                  }
                >
                  <Check />
                  {pending ? "Wird übernommen…" : "Update bestaetigen"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ScanLine className="size-4" />
            <span>
              Bereit fuer Live-Erkennung mit Bounding Boxes und
              Nutzerbestaetigung.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
