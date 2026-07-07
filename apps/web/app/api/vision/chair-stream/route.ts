import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"

import {
  getVisionStreamSnapshot,
  setVisionStreamSnapshot,
} from "@/lib/vision/vision-stream-store"
import type { VisionStreamDetection, VisionStreamSnapshot } from "@/lib/vision/stream-types"
import { VISION_STREAM_SOURCE } from "@/lib/vision/stream-types"

export async function GET() {
  return NextResponse.json({
    data: getVisionStreamSnapshot(),
    error: null,
    deprecated: true,
    successor: "/api/vision/stream",
  })
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<VisionStreamSnapshot> & {
    projectId?: string
    detected?: number
    averageCount?: number
    image?: string
  }

  if (!body.image?.startsWith("data:image/")) {
    return NextResponse.json(
      { data: null, error: { message: "image muss ein data:image Frame sein." } },
      { status: 400 }
    )
  }

  const projectId = body.projectId ?? "unknown"
  const detectionCount = Number(
    body.detectionCount ?? body.detected ?? body.detections?.length ?? 0
  )

  const snapshot = setVisionStreamSnapshot({
    id: body.id ?? body.sessionId ?? randomUUID(),
    sessionId: body.sessionId ?? body.id ?? randomUUID(),
    projectId,
    capturedAt: body.capturedAt ?? new Date().toISOString(),
    image: body.image,
    detectionCount: Math.max(0, Math.round(detectionCount)),
    detections: (body.detections ?? []) as VisionStreamDetection[],
    summary: body.summary ?? {
      message: `${detectionCount} Objekte erkannt.`,
      source: VISION_STREAM_SOURCE,
      mode: "scan",
    },
    source: VISION_STREAM_SOURCE,
  })

  return NextResponse.json({
    data: snapshot,
    error: null,
    deprecated: true,
    successor: "/api/vision/stream",
  })
}
