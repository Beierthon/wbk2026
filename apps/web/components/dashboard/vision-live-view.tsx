"use client"

import type { RefObject } from "react"
import { Loader2, ScanLine, Video } from "lucide-react"

import {
  getVisionScanFps,
  VISION_SCAN_INTERVAL_MS,
} from "@/lib/vision/scan-config"
import type { VisionDetection } from "@/lib/vision/types"
import { Badge } from "@workspace/ui/components/badge"

export type VisionLiveViewMode = "camera" | "demo" | "upload"

interface VisionLiveViewProps {
  mode: VisionLiveViewMode
  streaming: boolean
  startingCamera: boolean
  scanning: boolean
  pixelateFaces: boolean
  previewImage?: string | null
  detections: VisionDetection[]
  lastScanTime: string | null
  scanSource: string | null
  detectedCount: number | null
  videoRef: RefObject<HTMLVideoElement | null>
  privacyCanvasRef: RefObject<HTMLCanvasElement | null>
}

export function VisionLiveView({
  mode,
  streaming,
  startingCamera,
  scanning,
  pixelateFaces,
  previewImage,
  detections,
  lastScanTime,
  scanSource,
  detectedCount,
  videoRef,
  privacyCanvasRef,
}: VisionLiveViewProps) {
  return (
    <div className="space-y-3">
      <div
        className="relative aspect-video overflow-hidden rounded-2xl border bg-black"
        data-testid="vision-live-view"
      >
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
        ) : mode === "upload" && previewImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- data-URL Vorschau aus Kamera-Upload
          <img
            src={previewImage}
            alt="Hochgeladenes Baustellenbild mit Erkennungs-Overlay"
            className="h-full w-full object-cover"
          />
        ) : (
          <DemoBaustelleScene />
        )}

        {detections.map((detection) => (
          <DetectionOverlay key={detection.id} detection={detection} />
        ))}

        {scanning ? (
          <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <Loader2 className="size-3.5 animate-spin" />
            Scan laeuft
          </div>
        ) : null}

        {mode === "camera" && !streaming ? (
          <div className="absolute inset-0 grid place-items-center text-sm text-white/70">
            <span className="inline-flex items-center gap-2">
              <Video className="size-4" />
              {startingCamera ? "Kamera startet" : "Kamera wartet"}
            </span>
          </div>
        ) : null}

        {mode === "demo" ? (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-xs text-white/85 backdrop-blur-sm">
            Demo-Livestream · Mock-Vision
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">
          {getVisionScanFps()} FPS Scan ({VISION_SCAN_INTERVAL_MS} ms)
        </Badge>
        <Badge variant="secondary">{scanSource ?? "Vision wartet"}</Badge>
        <Badge variant="secondary">
          {detectedCount !== null
            ? `${detectedCount} Objekte erkannt`
            : "Noch kein Scan"}
        </Badge>
        {lastScanTime ? <span>Letzter Scan {lastScanTime}</span> : null}
        {scanning ? (
          <span className="inline-flex items-center gap-1.5 text-primary">
            <ScanLine className="size-3.5" />
            Erkennung aktiv
          </span>
        ) : null}
      </div>
    </div>
  )
}

function DemoBaustelleScene() {
  return (
    <div
      className="relative h-full w-full overflow-hidden bg-gradient-to-b from-slate-700 via-stone-800 to-stone-950"
      aria-hidden
    >
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-sky-900/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-stone-900/80" />
      <svg
        viewBox="0 0 640 360"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect x="0" y="250" width="640" height="110" fill="#3f3f46" />
        <rect x="40" y="210" width="180" height="50" fill="#57534e" rx="4" />
        <rect x="360" y="205" width="210" height="55" fill="#52525b" rx="4" />
        <rect x="70" y="170" width="120" height="40" fill="#78716c" opacity="0.9" />
        <rect x="390" y="165" width="140" height="40" fill="#71717a" opacity="0.9" />
        <line
          x1="0"
          y1="250"
          x2="640"
          y2="250"
          stroke="#a8a29e"
          strokeWidth="2"
          strokeDasharray="12 8"
        />
      </svg>
      <p className="absolute right-3 top-3 rounded-md bg-black/55 px-2 py-1 text-[10px] uppercase tracking-wide text-white/75">
        Baustellen-Demo
      </p>
    </div>
  )
}

export function DetectionOverlay({ detection }: { detection: VisionDetection }) {
  return (
    <div
      className="absolute border-2 border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
      style={{
        left: `${detection.box.x}%`,
        top: `${detection.box.y}%`,
        width: `${detection.box.width}%`,
        height: `${detection.box.height}%`,
      }}
      data-testid={`vision-detection-${detection.id}`}
    >
      <div className="max-w-full truncate bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
        {detection.label} {Math.round(detection.confidence * 100)}%
      </div>
    </div>
  )
}
