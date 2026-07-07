"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Camera,
  Check,
  CircleAlert,
  ImageUp,
  ScanLine,
  Video,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  buildExpectedItems,
  confirmVisionUpdate,
  inspectVisionFrame,
} from "@/lib/vision/client"
import type { MaterialWithBestellung } from "@/lib/data"
import type { VisionDetection, VisionInspectResponse } from "@/lib/vision/types"
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

const SCAN_INTERVAL_MS = 1200

interface VisionUpdatePanelProps {
  projectId: string
  materialien: MaterialWithBestellung[]
}

function mapCameraError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Kamera konnte nicht gestartet werden."
  }

  const name = error.name

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Kameraberechtigung wurde verweigert. Bitte erlaube den Kamerazugriff in den Browser- oder Geraeteeinstellungen."
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "Keine Kamera gefunden. Nutze den Demo-Scan ohne Kamera oder lade ein Testbild hoch."
  }

  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Die Kamera wird bereits von einer anderen Anwendung verwendet."
  }

  if (name === "SecurityError" || name === "NotSupportedError") {
    return "Kamerazugriff erfordert einen sicheren Kontext (HTTPS oder localhost). Auf dem Handy im LAN ohne TLS nutze den Demo-Scan."
  }

  if (name === "OverconstrainedError") {
    return "Die angeforderte Kamera ist auf diesem Geraet nicht verfuegbar."
  }

  return error.message || "Kamera konnte nicht gestartet werden."
}

function drawPixelatedFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  blockSize = 14
) {
  const width = 480
  const height = Math.max(
    1,
    Math.round((video.videoHeight / video.videoWidth) * width)
  )
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

function captureFrameDataUrl(
  video: HTMLVideoElement,
  pixelate: boolean
): string | null {
  const width = video.videoWidth
  const height = video.videoHeight

  if (!width || !height) {
    return null
  }

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")

  if (!context) {
    return null
  }

  if (pixelate) {
    drawPixelatedFrame(video, canvas)
  } else {
    context.drawImage(video, 0, 0, width, height)
  }

  return canvas.toDataURL("image/jpeg", 0.82)
}

export function VisionUpdatePanel({
  projectId,
  materialien,
}: VisionUpdatePanelProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const privacyCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const intervalRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const expectedItems = buildExpectedItems(materialien)

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"camera" | "demo" | "upload">("camera")
  const [streaming, setStreaming] = useState(false)
  const [startingCamera, setStartingCamera] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestResult, setLatestResult] =
    useState<VisionInspectResponse | null>(null)
  const [pixelateFaces, setPixelateFaces] = useState(true)

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStreaming(false)
  }, [])

  const runInspect = useCallback(
    async (image?: string) => {
      if (scanning) {
        return
      }

      setScanning(true)

      try {
        const result = await inspectVisionFrame({
          image,
          mode: "scan",
          expectedItems,
        })

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

  const inspectVideoFrame = useCallback(async () => {
    const video = videoRef.current

    if (!video || !video.videoWidth || !video.videoHeight) {
      return
    }

    const image = captureFrameDataUrl(video, pixelateFaces)

    if (!image) {
      return
    }

    await runInspect(image)
  }, [pixelateFaces, runInspect])

  async function startCamera() {
    setOpen(true)
    setMode("camera")
    setError(null)
    setLatestResult(null)
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
      window.setTimeout(() => void inspectVideoFrame(), 700)
      intervalRef.current = window.setInterval(() => {
        void inspectVideoFrame()
      }, SCAN_INTERVAL_MS)
    } catch (cameraError) {
      setError(mapCameraError(cameraError))
    } finally {
      setStartingCamera(false)
    }
  }

  async function startDemoScan() {
    stopCamera()
    setOpen(true)
    setMode("demo")
    setError(null)
    setLatestResult(null)
    await runInspect()
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
      const image = typeof reader.result === "string" ? reader.result : undefined

      if (!image) {
        setError("Bild konnte nicht gelesen werden.")
        return
      }

      await runInspect(image)
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
    setError(null)
  }

  async function confirmResult() {
    if (!latestResult || latestResult.detections.length === 0) {
      return
    }

    setConfirming(true)

    try {
      await confirmVisionUpdate({
        projectId,
        capturedAt: latestResult.capturedAt,
        detections: latestResult.detections.map((detection) => ({
          materialId: detection.materialId,
          label: detection.label,
          interpreted: detection.interpreted,
          systemMatch: detection.systemMatch,
        })),
      })

      toast.success("Materialstand aus Kamera/Vision uebernommen.")
      closeCamera()
      router.refresh()
    } catch (confirmError) {
      toast.error(
        confirmError instanceof Error
          ? confirmError.message
          : "Bestaetigung fehlgeschlagen."
      )
    } finally {
      setConfirming(false)
    }
  }

  function rejectResult() {
    setLatestResult(null)
    setError("Erkennung verworfen. Der Materialbestand wurde nicht geaendert.")
  }

  useEffect(() => stopCamera, [stopCamera])

  useEffect(() => {
    if (!open || mode !== "camera" || !streaming || !pixelateFaces) {
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
  }, [mode, open, pixelateFaces, streaming])

  const detections = latestResult?.detections ?? []
  const lastScanTime = latestResult
    ? new Date(latestResult.capturedAt).toLocaleTimeString("de-DE")
    : null

  return (
    <Card className="border-primary/25">
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Vision-Update fuer ERP/EAP</CardTitle>
            <Badge variant="outline">Mock-Vision</Badge>
          </div>
          <CardDescription>
            Baustellen-Scan per Handy-Kamera starten, erkannte Materialpositionen
            pruefen und erst nach Bestaetigung ins ERP/EAP uebernehmen.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void handleFileUpload(event)}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageUp />
            Bild hochladen
          </Button>
          <Button variant="outline" onClick={() => void startDemoScan()}>
            <ScanLine />
            Demo-Scan ohne Kamera
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
            Auf dem Handy wird die Rueckkamera bevorzugt. Fuer Desktop-Demos ohne
            Webcam nutze den Demo-Scan oder lade ein Testbild hoch.
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

        {open ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-3">
              <div className="relative aspect-video overflow-hidden rounded-2xl border bg-black">
                {mode === "camera" ? (
                  <>
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
                  </>
                ) : (
                  <div className="grid h-full place-items-center text-sm text-white/80">
                    <span className="inline-flex items-center gap-2 px-4 text-center">
                      <Video className="size-4 shrink-0" />
                      {mode === "demo"
                        ? "Demo-Scan mit stabilen Beispieldaten"
                        : "Hochgeladenes Testbild wird analysiert"}
                    </span>
                  </div>
                )}

                {detections.map((detection) => (
                  <DetectionOverlay key={detection.id} detection={detection} />
                ))}

                {mode === "camera" && !streaming ? (
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
                <Badge variant="outline">
                  {Math.round(1000 / SCAN_INTERVAL_MS)} FPS Scan
                </Badge>
                <Badge variant="secondary">
                  {latestResult?.source ?? "Vision wartet"}
                </Badge>
                <Badge variant="secondary">
                  {latestResult
                    ? `${latestResult.summary.detected} Objekte erkannt`
                    : "Noch kein Scan"}
                </Badge>
                {lastScanTime ? <span>Letzter Scan {lastScanTime}</span> : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border p-4">
              <div className="space-y-1">
                <h2 className="font-heading text-base font-medium">
                  Erkannte Materialpositionen
                </h2>
                <p className="text-sm text-muted-foreground">
                  {latestResult?.summary.message ??
                    "Starte einen Scan, um Treffer gegen die ERP/EAP-Materialdaten zu sehen."}
                </p>
              </div>

              <div className="flex max-h-72 flex-col gap-2 overflow-auto pr-1">
                {detections.length > 0 ? (
                  detections.map((detection) => (
                    <DetectionSummary key={detection.id} detection={detection} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Noch keine Erkennungen. Kamera starten oder Demo-Scan nutzen.
                  </p>
                )}
              </div>

              <div className="mt-auto flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={closeCamera}>
                  <X />
                  Schliessen
                </Button>
                <Button variant="outline" onClick={rejectResult}>
                  Verwerfen
                </Button>
                <Button
                  onClick={() => void confirmResult()}
                  disabled={!latestResult || detections.length === 0 || confirming}
                >
                  <Check />
                  {confirming ? "Wird uebernommen..." : "Update bestaetigen"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ScanLine className="size-4" />
            <span>
              Bereit fuer {expectedItems.length} Materialpositionen im
              ERP/EAP-Abgleich.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DetectionOverlay({ detection }: { detection: VisionDetection }) {
  return (
    <div
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
  )
}

function DetectionSummary({ detection }: { detection: VisionDetection }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-medium">{detection.label}</p>
        <Badge
          variant={detection.confidence >= 0.75 ? "default" : "secondary"}
        >
          {Math.round(detection.confidence * 100)}%
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Verbaut: {detection.interpreted.verbaut}{" "}
        {detection.interpreted.einheit}, verbleibend:{" "}
        {detection.interpreted.verbleibend} {detection.interpreted.einheit}
      </p>
      {detection.systemMatch.externeReferenz ? (
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          ERP: {detection.systemMatch.externeReferenz}
        </p>
      ) : null}
    </div>
  )
}
