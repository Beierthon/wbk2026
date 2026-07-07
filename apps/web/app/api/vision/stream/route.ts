import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"

import {
  getVisionStreamSnapshot,
  setVisionStreamSnapshot,
} from "@/lib/vision/vision-stream-store"
import type { VisionStreamSnapshot } from "@/lib/vision/stream-types"
import { VISION_STREAM_SOURCE } from "@/lib/vision/stream-types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId") ?? undefined
  const snapshot = getVisionStreamSnapshot()

  if (projectId && snapshot && snapshot.projectId !== projectId) {
    return NextResponse.json({
      data: null,
      error: null,
    })
  }

  return NextResponse.json({
    data: snapshot,
    error: null,
  })
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<VisionStreamSnapshot> & {
    projectId?: string
  }

  if (!body.projectId) {
    return NextResponse.json(
      { data: null, error: { message: "projectId ist erforderlich." } },
      { status: 400 }
    )
  }

  if (!body.image?.startsWith("data:image/")) {
    return NextResponse.json(
      {
        data: null,
        error: { message: "image muss ein data:image Frame sein." },
      },
      { status: 400 }
    )
  }

  const detectionCount = Number(body.detectionCount ?? body.detections?.length ?? 0)

  if (!Number.isFinite(detectionCount) || detectionCount < 0) {
    return NextResponse.json(
      { data: null, error: { message: "detectionCount muss >= 0 sein." } },
      { status: 400 }
    )
  }

  const sessionId = body.sessionId ?? randomUUID()
  const snapshot = setVisionStreamSnapshot({
    id: body.id ?? sessionId,
    sessionId,
    projectId: body.projectId,
    capturedAt: body.capturedAt ?? new Date().toISOString(),
    image: body.image,
    detectionCount: Math.round(detectionCount),
    detections: body.detections ?? [],
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
  })
}
