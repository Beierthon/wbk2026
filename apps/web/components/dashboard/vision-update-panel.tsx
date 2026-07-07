"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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

import { confirmVisionUpdate, recordVisionCapture } from "@/lib/vision/client"
import { buildVisionExpectedItems } from "@/lib/vision/build-expected-items"
import {
  detectFromImageDataUrl,
  detectWithCocoSsd,
  loadCocoSsdModel,
  type CocoModelStatus,
} from "@/lib/vision/coco-ssd-detector"
import {
  getVisionDetectorBadge,
  useBrowserVisionDetector,
} from "@/lib/vision/client-config"
import { inspectVisionFrameClient } from "@/lib/vision/inspect-client"
import {
  VISION_SCAN_INTERVAL_MS,
  visionScanFps,
} from "@/lib/vision/scan-config"
import type { MaterialWithBestellung } from "@/lib/data"
import type { VisionDetection, VisionInspectResponse } from "@/lib/vision/types"
import {
  VisionDemoFrame,
  VISION_DEMO_FRAME_HEIGHT,
  VISION_DEMO_FRAME_WIDTH,
} from "@/components/dashboard/vision-demo-frame"
import { VisionOverlayLayer } from "@/components/dashboard/vision-overlay-layer"
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
interface VisionUpdatePanelProps {
  projectId: string
  materialien: MaterialWithBestellung[]
  standortId?: string
  planversionId?: string
  bauabschnitt?: string
}

function mapCameraError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Camera could not be started."
  }

  const name = error.name

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Camera permission was denied. Please allow camera access in browser or device settings."
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera found. Use demo scan without a camera or upload a test image."
  }

  if (name === "NotReadableError" || name === "TrackStartError") {
    return "The camera is already in use by another application."
  }

  if (name === "SecurityError" || name === "NotSupportedError") {
    return "Camera access requires a secure context (HTTPS or localhost). On a phone over LAN without TLS, use demo scan."
  }

  if (name === "OverconstrainedError") {
    return "The requested camera is not available on this device."
  }

  return error.message || "Camera could not be started."
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

function readImageDimensions(
  image: string
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image()

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }

    img.onerror = () => resolve(null)
    img.src = image
  })
}

export function VisionUpdatePanel({
  projectId,
  materialien,
  standortId,
  planversionId,
  bauabschnitt,
}: VisionUpdatePanelProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const privacyCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const intervalRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef(false)

  const expectedItems = buildVisionExpectedItems(materialien)
  const browserDetectorEnabled = useBrowserVisionDetector()
  const captureKontext = useMemo(
    () => ({
      standortId,
      planversionId,
      bauabschnitt,
    }),
    [bauabschnitt, planversionId, standortId]
  )

  const logCapture = useCallback(
    async (capturedAt: string, quelle: "camera" | "upload" | "demo") => {
      try {
        await recordVisionCapture({
          projectId,
          capturedAt,
          quelle,
          kontext: captureKontext,
        })
      } catch {
        // Protokollierung darf den Scan nicht blockieren.
      }
    },
    [captureKontext, projectId]
  )

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"camera" | "demo" | "upload">("camera")
  const [streaming, setStreaming] = useState(false)
  const [startingCamera, setStartingCamera] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestResult, setLatestResult] =
    useState<VisionInspectResponse | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [frameSize, setFrameSize] = useState({
    width: VISION_DEMO_FRAME_WIDTH,
    height: VISION_DEMO_FRAME_HEIGHT,
  })
  const [pixelateFaces, setPixelateFaces] = useState(true)
  const [modelStatus, setModelStatus] = useState<CocoModelStatus>("idle")

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStreaming(false)
  }, [])

  const runServerInspect = useCallback(
    async (image?: string) => {
      if (scanningRef.current) {
        return
      }

      scanningRef.current = true
      setScanning(true)

      try {
        const result = await inspectVisionFrameClient({
          projectId,
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
            : "Vision scan failed."
        )
      } finally {
        scanningRef.current = false
        setScanning(false)
      }
    },
    [expectedItems, projectId]
  )

  const runBrowserInspect = useCallback(
    async (source: "video" | "image", image?: string) => {
      if (scanningRef.current) {
        return
      }

      scanningRef.current = true
      setScanning(true)

      try {
        setModelStatus("loading")

        const result =
          source === "video" && videoRef.current
            ? await detectWithCocoSsd(videoRef.current, expectedItems)
            : image
              ? await detectFromImageDataUrl(image, expectedItems)
              : null

        if (result) {
          setLatestResult(result)
          setModelStatus("ready")
          setError(null)
          return
        }

        setModelStatus("failed")
        await runServerInspect(image)
      } catch (requestError) {
        setModelStatus("failed")
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Vision scan failed."
        )
      } finally {
        scanningRef.current = false
        setScanning(false)
      }
    },
    [expectedItems, runServerInspect]
  )

  const runLiveInspect = useCallback(
    async (source: "video" | "image", image?: string) => {
      if (!browserDetectorEnabled) {
        await runServerInspect(image)
        return
      }

      await runBrowserInspect(source, image)
    },
    [browserDetectorEnabled, runBrowserInspect, runServerInspect]
  )

  const runDemoInspect = useCallback(async () => {
    if (scanningRef.current) {
      return
    }

    scanningRef.current = true
    setScanning(true)

    try {
      const capturedAt = new Date().toISOString()
      void logCapture(capturedAt, "demo")
      await runServerInspect()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Vision scan failed."
      )
    } finally {
      scanningRef.current = false
      setScanning(false)
    }
  }, [logCapture, runServerInspect])

  const inspectVideoFrame = useCallback(async () => {
    const video = videoRef.current

    if (!video || !video.videoWidth || !video.videoHeight) {
      return
    }

    setFrameSize({
      width: video.videoWidth,
      height: video.videoHeight,
    })

    const image = captureFrameDataUrl(video, pixelateFaces)

    if (image) {
      setPreviewImage(image)
      void logCapture(new Date().toISOString(), "camera")
    }

    await runLiveInspect("video", image ?? undefined)
  }, [logCapture, pixelateFaces, runLiveInspect])

  async function startCamera() {
    setOpen(true)
    setMode("camera")
    setError(null)
    setLatestResult(null)
    setPreviewImage(null)
    setStartingCamera(true)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not allow direct camera access.")
      setStartingCamera(false)
      return
    }

    try {
      if (browserDetectorEnabled) {
        void loadCocoSsdModel().then((model) => {
          setModelStatus(model ? "ready" : "failed")
        })
      } else {
        setModelStatus("idle")
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

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setStreaming(true)
      window.setTimeout(() => void inspectVideoFrame(), 700)
      intervalRef.current = window.setInterval(() => {
        void inspectVideoFrame()
      }, VISION_SCAN_INTERVAL_MS)
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
    setPreviewImage(null)
    setFrameSize({
      width: VISION_DEMO_FRAME_WIDTH,
      height: VISION_DEMO_FRAME_HEIGHT,
    })
    await runDemoInspect()
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
    setPreviewImage(null)

    const reader = new FileReader()

    reader.onload = async () => {
      const image =
        typeof reader.result === "string" ? reader.result : undefined

      if (!image) {
        setError("Image could not be read.")
        return
      }

      setPreviewImage(image)
      void logCapture(new Date().toISOString(), "upload")

      const dimensions = await readImageDimensions(image)

      if (dimensions) {
        setFrameSize(dimensions)
      }

      await runLiveInspect("image", image)
    }

    reader.onerror = () => {
      setError("Image could not be read.")
    }

    reader.readAsDataURL(file)
    event.target.value = ""
  }

  function closeCamera() {
    stopCamera()
    setOpen(false)
    setLatestResult(null)
    setPreviewImage(null)
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
        kontext: captureKontext,
        detections: latestResult.detections.map((detection) => ({
          materialId: detection.materialId,
          label: detection.label,
          interpreted: detection.interpreted,
          systemMatch: detection.systemMatch,
        })),
      })

      toast.success("Material stock applied from camera/vision.")
      closeCamera()
      router.refresh()
    } catch (confirmError) {
      toast.error(
        confirmError instanceof Error
          ? confirmError.message
          : "Confirmation failed."
      )
    } finally {
      setConfirming(false)
    }
  }

  function rejectResult() {
    setLatestResult(null)
    setError("Detection discarded. Material stock was not changed.")
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
  const detectorBadge = getVisionDetectorBadge(
    latestResult?.source,
    browserDetectorEnabled
  )
  const lastScanTime = latestResult
    ? new Date(latestResult.capturedAt).toLocaleTimeString("en-GB")
    : null
  const averageConfidence =
    detections.length > 0
      ? Math.round(
          (detections.reduce(
            (sum, detection) => sum + detection.confidence,
            0
          ) /
            detections.length) *
            100
        )
      : null

  return (
    <Card className="border-primary/25" data-tour="bau-kamera">
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Vision update for ERP/EAP</CardTitle>
            <Badge variant="outline">{detectorBadge}</Badge>
          </div>
          <CardDescription>
            {browserDetectorEnabled
              ? "Live detection via TensorFlow.js/COCO-SSD in the browser for camera and image upload. Demo scan still uses ERP sample data."
              : "Server vision (OpenAI or mock) for camera, upload, and demo scan. Preset: .env.vision-openai.example"}{" "}
            Apply detected positions to ERP/EAP only after confirmation.
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
            Upload image
          </Button>
          <Button variant="outline" onClick={() => void startDemoScan()}>
            <ScanLine />
            Demo scan without camera
          </Button>
          <Button onClick={() => void startCamera()} disabled={startingCamera}>
            <Camera />
            {startingCamera ? "Starting camera..." : "Start camera update"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-xl border border-dashed bg-secondary/30 p-3 text-sm text-muted-foreground">
          <p>
            {browserDetectorEnabled
              ? "On mobile, the rear camera is preferred. Camera and image upload use TensorFlow.js/COCO-SSD directly in the browser. For ERP material demos without a webcam, use demo scan."
              : "Camera, upload, and demo scan run through the server vision API. Set OPENAI_API_KEY and WBK_VISION_MODE=openai in .env.local (see .env.vision-openai.example)."}
          </p>
          <div className="flex items-center gap-3">
            <Switch
              id="vision-privacy-pixelate"
              checked={pixelateFaces}
              onCheckedChange={setPixelateFaces}
            />
            <Label htmlFor="vision-privacy-pixelate">
              Pixelate faces (privacy)
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
                          : "h-full w-full object-contain"
                      }
                      muted
                      playsInline
                    />
                    {pixelateFaces && streaming ? (
                      <canvas
                        ref={privacyCanvasRef}
                        className="h-full w-full object-contain"
                      />
                    ) : null}
                  </>
                ) : mode === "upload" && previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- data URL preview from file upload
                  <img
                    src={previewImage}
                    alt="Uploaded test image"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <VisionDemoFrame />
                )}

                <VisionOverlayLayer
                  detections={detections}
                  mediaWidth={frameSize.width}
                  mediaHeight={frameSize.height}
                  scanning={scanning}
                />

                {mode === "camera" && !streaming ? (
                  <div className="absolute inset-0 grid place-items-center text-sm text-white/70">
                    <span className="inline-flex items-center gap-2">
                      <Video className="size-4" />
                      {startingCamera ? "Starting camera" : "Camera waiting"}
                    </span>
                  </div>
                ) : null}

                {mode === "demo" ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-sm text-white/90">
                    <span className="inline-flex items-center gap-2">
                      <Video className="size-4 shrink-0" />
                      Demo scan with fixed construction-site frame
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
                <Badge variant="outline">{detectorBadge}</Badge>
                <Badge variant="outline">
                  {visionScanFps(VISION_SCAN_INTERVAL_MS)} FPS Scan
                </Badge>
                {browserDetectorEnabled && modelStatus !== "idle" ? (
                  <Badge variant="secondary">
                    {modelStatus === "ready"
                      ? "TensorFlow model ready"
                      : modelStatus === "loading"
                        ? "TensorFlow model loading"
                        : "Server fallback active"}
                  </Badge>
                ) : null}
                {scanning ? (
                  <Badge variant="default" className="animate-pulse">
                    Scanning...
                  </Badge>
                ) : null}
                <Badge variant="secondary">
                  {latestResult?.source ?? "Vision waiting"}
                </Badge>
                <Badge variant="secondary">
                  {latestResult
                    ? `${latestResult.summary.detected} objects detected`
                    : "No scan yet"}
                </Badge>
                {averageConfidence !== null ? (
                  <Badge variant="secondary">
                    Ø Confidence {averageConfidence}%
                  </Badge>
                ) : null}
                {lastScanTime ? <span>Last scan {lastScanTime}</span> : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border p-4">
              <div className="space-y-1">
                <h2 className="font-heading text-base font-medium">
                  Detected material positions
                </h2>
                <p className="text-sm text-muted-foreground">
                  {latestResult?.summary.message ??
                    "Start a scan to see matches against ERP/EAP material data."}
                </p>
              </div>

              <div className="flex max-h-72 flex-col gap-2 overflow-auto pr-1">
                {detections.length > 0 ? (
                  detections.map((detection) => (
                    <DetectionSummary
                      key={detection.id}
                      detection={detection}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No detections yet. Start the camera or use demo scan.
                  </p>
                )}
              </div>

              <div className="mt-auto flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={closeCamera}>
                  <X />
                  Close
                </Button>
                <Button variant="outline" onClick={rejectResult}>
                  Discard
                </Button>
                <Button
                  onClick={() => void confirmResult()}
                  disabled={
                    !latestResult || detections.length === 0 || confirming
                  }
                >
                  <Check />
                  {confirming ? "Applying..." : "Confirm update"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ScanLine className="size-4" />
            <span>
              Ready for {expectedItems.length} material positions in the ERP/EAP
              reconciliation.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DetectionSummary({ detection }: { detection: VisionDetection }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-medium">{detection.label}</p>
        <Badge variant={detection.confidence >= 0.75 ? "default" : "secondary"}>
          {Math.round(detection.confidence * 100)}%
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Installed: {detection.interpreted.verbaut}{" "}
        {detection.interpreted.einheit}, remaining:{" "}
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
