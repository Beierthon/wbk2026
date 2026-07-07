"use client"

import { useEffect, useRef, useState } from "react"

import type { VisionDetection } from "@/lib/vision/types"

export interface ObjectContainLayout {
  left: number
  top: number
  width: number
  height: number
}

export function computeObjectContainLayout(
  containerWidth: number,
  containerHeight: number,
  mediaWidth: number,
  mediaHeight: number
): ObjectContainLayout {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    mediaWidth <= 0 ||
    mediaHeight <= 0
  ) {
    return {
      left: 0,
      top: 0,
      width: containerWidth,
      height: containerHeight,
    }
  }

  const scale = Math.min(
    containerWidth / mediaWidth,
    containerHeight / mediaHeight
  )
  const width = mediaWidth * scale
  const height = mediaHeight * scale

  return {
    left: (containerWidth - width) / 2,
    top: (containerHeight - height) / 2,
    width,
    height,
  }
}

interface VisionOverlayLayerProps {
  detections: VisionDetection[]
  mediaWidth: number
  mediaHeight: number
  scanning?: boolean
}

export function VisionOverlayLayer({
  detections,
  mediaWidth,
  mediaHeight,
  scanning = false,
}: VisionOverlayLayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [layout, setLayout] = useState<ObjectContainLayout>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const updateLayout = () => {
      const rect = container.getBoundingClientRect()

      setLayout(
        computeObjectContainLayout(
          rect.width,
          rect.height,
          mediaWidth,
          mediaHeight
        )
      )
    }

    updateLayout()

    const observer = new ResizeObserver(updateLayout)
    observer.observe(container)

    return () => observer.disconnect()
  }, [mediaHeight, mediaWidth])

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      {scanning ? (
        <div
          className="absolute animate-pulse rounded-sm border-2 border-dashed border-primary/70 bg-primary/5"
          style={{
            left: layout.left,
            top: layout.top,
            width: layout.width,
            height: layout.height,
          }}
        />
      ) : null}

      {detections.map((detection) => (
        <div
          key={`${detection.materialId}-${Math.round(detection.box.x)}-${Math.round(detection.box.y)}-${Math.round(detection.box.width)}`}
          className="absolute border-2 border-primary bg-primary/10 shadow-sm transition-[left,top,width,height,opacity] duration-150"
          style={{
            left: layout.left + (detection.box.x / 100) * layout.width,
            top: layout.top + (detection.box.y / 100) * layout.height,
            width: (detection.box.width / 100) * layout.width,
            height: (detection.box.height / 100) * layout.height,
          }}
        >
          <div className="max-w-full truncate bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
            {detection.label} {Math.round(detection.confidence * 100)}%
          </div>
        </div>
      ))}
    </div>
  )
}
