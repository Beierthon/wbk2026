"use client"

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  Camera,
  Check,
  CircleAlert,
  ImageIcon,
  RefreshCw,
  ScanLine,
  Sparkles,
  Upload,
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
import { Slider } from "@workspace/ui/components/slider"
import { Spinner } from "@workspace/ui/components/spinner"
import { Switch } from "@workspace/ui/components/switch"

const DEFAULT_SCAN_INTERVAL_SECONDS = 4
const MIN_SCAN_INTERVAL_SECONDS = 2
const MAX_SCAN_INTERVAL_SECONDS = 15

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
  reason: string
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
  detail?: {
    zustand: string
    geschaetzteAnzahl: number
    sichtbareMaengel: string[]
    empfehlung: string
  }
}

interface VisionResponse {
  capturedAt: string
  frameRate: number
  source: string
  mode: "scan" | "detail"
  summary: {
    expected: number
    detected: number
    matched: number
    needsConfirmation: boolean
    message: string
  }
  detections: VisionDetection[]
}

interface ConfirmedVisionUpdate {
  capturedAt: string
  detections: VisionDetection[]
}

type VisionMediaSource = "camera" | "upload"

export function VisionCameraPanel({
  materialien,
}: {
  materialien: VisionMaterialItem[]
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<number | null>(null)
  const scanningRef = useRef(false)

  const [open, setOpen] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestResult, setLatestResult] = useState<VisionResponse | null>(null)
  const [confirmedUpdate, setConfirmedUpdate] =
    useState<ConfirmedVisionUpdate | null>(null)
  const [mediaSource, setMediaSource] = useState<VisionMediaSource | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState<string | null>(null)
  const [focusedDetection, setFocusedDetection] =
    useState<VisionDetection | null>(null)
  const [autoScanEnabled, setAutoScanEnabled] = useState(false)
  const [scanIntervalSeconds, setScanIntervalSeconds] = useState(
    DEFAULT_SCAN_INTERVAL_SECONDS
  )

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

  const stopAutoScan = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const inspectImage = useCallback(
    async ({
      image,
      mode = "scan",
      focusMaterialId,
    }: {
      image: string
      mode?: "scan" | "detail"
      focusMaterialId?: string
    }) => {
      if (scanningRef.current) {
        return
      }

      scanningRef.current = true
      setScanning(true)
      setError(null)

      try {
        const response = await fetch("/api/vision/inspect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image,
            mode,
            focusMaterialId,
            expectedItems,
          }),
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: { message?: string }
          } | null

          throw new Error(
            body?.error?.message ??
              "Vision-Backend konnte das Bild nicht verarbeiten."
          )
        }

        const result = (await response.json()) as VisionResponse
        setLatestResult(result)

        if (mode === "detail") {
          setFocusedDetection(result.detections[0] ?? null)
        } else {
          setFocusedDetection(null)
        }
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Vision-Scan ist fehlgeschlagen."
        )
      } finally {
        scanningRef.current = false
        setScanning(false)
      }
    },
    [expectedItems]
  )

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      return null
    }

    canvas.width = 640
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 640)
    const context = canvas.getContext("2d")
    context?.drawImage(video, 0, 0, canvas.width, canvas.height)

    return canvas.toDataURL("image/jpeg", 0.62)
  }, [])

  const inspectFrame = useCallback(
    async (mode: "scan" | "detail" = "scan", focusMaterialId?: string) => {
      const image = captureFrame()

      if (!image) {
        return
      }

      setPreviewImage(null)
      setPreviewName(null)
      setMediaSource("camera")
      await inspectImage({ image, mode, focusMaterialId })
    },
    [captureFrame, inspectImage]
  )

  async function startCamera() {
    setOpen(true)
    setError(null)
    setMediaSource("camera")
    setFocusedDetection(null)

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
    setPreviewImage(null)
    setPreviewName(null)
    setMediaSource(null)
    setFocusedDetection(null)
    setAutoScanEnabled(false)
  }

  function confirmResult() {
    if (!latestResult) {
      return
    }

    setConfirmedUpdate({
      capturedAt: latestResult.capturedAt,
      detections: latestResult.detections,
    })
    closeCamera()
  }

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      setError("Bitte ein Bild im Format JPEG, PNG oder WebP auswaehlen.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const image = typeof reader.result === "string" ? reader.result : null

      if (!image) {
        setError("Bild konnte nicht gelesen werden.")
        return
      }

      stopCamera()
      setOpen(false)
      setMediaSource("upload")
      setPreviewImage(image)
      setPreviewName(file.name)
      setFocusedDetection(null)
      void inspectImage({ image })
    }
    reader.onerror = () => {
      setError("Bild konnte nicht gelesen werden.")
    }
    reader.readAsDataURL(file)
    event.target.value = ""
  }

  function inspectFocusedDetection(detection: VisionDetection) {
    setFocusedDetection(detection)
    stopAutoScan()
    setAutoScanEnabled(false)

    if (mediaSource === "upload" && previewImage) {
      void inspectImage({
        image: previewImage,
        mode: "detail",
        focusMaterialId: detection.materialId,
      })
      return
    }

    void inspectFrame("detail", detection.materialId)
  }

  useEffect(() => stopCamera, [stopCamera])

  useEffect(() => {
    stopAutoScan()

    if (!autoScanEnabled || !streaming) {
      return
    }

    void inspectFrame()
    intervalRef.current = window.setInterval(() => {
      void inspectFrame()
    }, scanIntervalSeconds * 1000)

    return stopAutoScan
  }, [
    autoScanEnabled,
    inspectFrame,
    scanIntervalSeconds,
    stopAutoScan,
    streaming,
  ])

  const lastScanTime = latestResult
    ? new Date(latestResult.capturedAt).toLocaleTimeString("de-DE")
    : null
  const showInspectionSurface = open || previewImage
  const activeDetections = latestResult?.detections ?? []
  const autoScanLabel = autoScanEnabled ? "Auto-Scan aktiv" : "Auto-Scan aus"

  return (
    <Card className="border-primary/25">
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Vision-Update fuer ERP/EAP</CardTitle>
          <CardDescription>
            Kamera- oder Bildanalyse mit Bauteilabgleich, Detailpruefung und
            Bestaetigung vor dem Dashboard-Update.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="outline" onClick={handleUploadClick}>
            <Upload />
            Bild hochladen
          </Button>
          <Button onClick={() => void startCamera()}>
            <Camera />
            Kamera starten
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
                    Quelle: Vision {"->"} ERP/EAP-Abgleich
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {showInspectionSurface ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="flex flex-col gap-3">
              <div className="relative aspect-video overflow-hidden rounded-2xl border bg-black">
                {previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewImage}
                    alt={previewName ?? "Hochgeladenes Baustellenbild"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />
                )}
                <canvas ref={canvasRef} className="hidden" />
                {activeDetections.map((detection) => (
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
                {!streaming && !previewImage ? (
                  <div className="absolute inset-0 grid place-items-center text-sm text-white/70">
                    <span className="inline-flex items-center gap-2">
                      <Video />
                      Kamera wartet
                    </span>
                  </div>
                ) : null}
              </div>

              {error ? (
                <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <CircleAlert className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">
                  {mediaSource === "upload"
                    ? "Bild-Upload"
                    : `${scanIntervalSeconds}s Kamera-Scan`}
                </Badge>
                <Badge variant={autoScanEnabled ? "default" : "outline"}>
                  {autoScanLabel}
                </Badge>
                <Badge
                  variant={
                    latestResult?.source === "openai-vision"
                      ? "default"
                      : "secondary"
                  }
                >
                  {latestResult?.source === "openai-vision" ? "OpenAI" : "Mock"}
                </Badge>
                <Badge variant="secondary">
                  {latestResult
                    ? `${latestResult.summary.matched}/${latestResult.summary.expected} Treffer`
                    : "Noch kein Ergebnis"}
                </Badge>
                {lastScanTime ? <span>Letzter Scan {lastScanTime}</span> : null}
                {scanning ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner />
                    Analyse laeuft
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border p-4">
              {mediaSource === "camera" ? (
                <div className="flex flex-col gap-3 rounded-xl border bg-secondary/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">Automatischer Scan</p>
                      <p className="text-xs text-muted-foreground">
                        {autoScanEnabled
                          ? `Alle ${scanIntervalSeconds} Sekunden`
                          : "Pausiert"}
                      </p>
                    </div>
                    <Switch
                      checked={autoScanEnabled}
                      disabled={!streaming}
                      onCheckedChange={setAutoScanEnabled}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Slider
                      min={MIN_SCAN_INTERVAL_SECONDS}
                      max={MAX_SCAN_INTERVAL_SECONDS}
                      step={1}
                      value={[scanIntervalSeconds]}
                      disabled={autoScanEnabled || !streaming}
                      onValueChange={(value) => {
                        setScanIntervalSeconds(
                          value[0] ?? DEFAULT_SCAN_INTERVAL_SECONDS
                        )
                      }}
                    />
                    <span className="w-10 text-right text-xs text-muted-foreground">
                      {scanIntervalSeconds}s
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-base font-medium">
                  Vorschlaege pruefen
                </h2>
                <p className="text-sm text-muted-foreground">
                  KI-Ergebnisse werden erst nach deiner Bestaetigung als
                  Dashboard-Update vorgemerkt.
                </p>
              </div>

              {latestResult ? (
                <p className="rounded-xl bg-secondary/50 p-3 text-sm text-muted-foreground">
                  {latestResult.summary.message}
                </p>
              ) : null}

              <div className="flex max-h-96 flex-col gap-2 overflow-auto pr-1">
                {activeDetections.length > 0 ? (
                  activeDetections.map((detection) => (
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
                        {detection.reason}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Verbaut: {detection.interpreted.verbaut}{" "}
                        {detection.interpreted.einheit}, verbleibend{" "}
                        {detection.interpreted.verbleibend}{" "}
                        {detection.interpreted.einheit}
                      </p>
                      {detection.detail ? (
                        <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                          <p>Zustand: {detection.detail.zustand}</p>
                          <p>
                            Schaetzung: {detection.detail.geschaetzteAnzahl}{" "}
                            {detection.interpreted.einheit}
                          </p>
                          {detection.detail.sichtbareMaengel.length > 0 ? (
                            <p>
                              Maengel:{" "}
                              {detection.detail.sichtbareMaengel.join(", ")}
                            </p>
                          ) : null}
                          <p>{detection.detail.empfehlung}</p>
                        </div>
                      ) : null}
                      {detection.systemMatch.externeReferenz ? (
                        <p className="mt-2 font-mono text-xs text-muted-foreground">
                          {detection.systemMatch.externeReferenz}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => inspectFocusedDetection(detection)}
                          disabled={scanning}
                        >
                          <Sparkles />
                          genauer analysieren
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Starte die Kamera oder lade ein Baustellenbild hoch.
                  </p>
                )}
              </div>

              {focusedDetection ? (
                <div className="rounded-xl border bg-secondary/40 p-3 text-sm text-muted-foreground">
                  Fokus: {focusedDetection.label}. Du kannst den Vorschlag jetzt
                  bestaetigen oder weiter verwerfen.
                </div>
              ) : null}

              <div className="mt-auto flex flex-wrap justify-end gap-2">
                {mediaSource === "camera" ? (
                  <Button
                    variant="ghost"
                    onClick={() => void inspectFrame()}
                    disabled={!streaming || scanning}
                  >
                    <RefreshCw className={scanning ? "animate-spin" : ""} />
                    Frame scannen
                  </Button>
                ) : null}
                {mediaSource === "upload" && previewImage ? (
                  <Button
                    variant="ghost"
                    onClick={() => void inspectImage({ image: previewImage })}
                    disabled={scanning}
                  >
                    <RefreshCw className={scanning ? "animate-spin" : ""} />
                    Bild erneut scannen
                  </Button>
                ) : null}
                <Button variant="outline" onClick={closeCamera}>
                  <X />
                  Schliessen
                </Button>
                <Button
                  onClick={confirmResult}
                  disabled={!latestResult || latestResult.detections.length === 0}
                >
                  <Check />
                  Vorschlag bestaetigen
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ScanLine />
            <span>
              Bereit fuer Live-Erkennung, Upload-Analyse und
              Nutzerbestaetigung.
            </span>
            <ImageIcon />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
