import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"

import {
  getChairStreamSnapshot,
  setChairStreamSnapshot,
  type SharedChairStreamSnapshot,
} from "@/lib/vision/chair-stream"

export async function GET() {
  return NextResponse.json({
    data: getChairStreamSnapshot(),
    error: null,
  })
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<SharedChairStreamSnapshot>

  if (!body.image?.startsWith("data:image/")) {
    return NextResponse.json(
      { data: null, error: { message: "image muss ein data:image Frame sein." } },
      { status: 400 }
    )
  }

  const detected = Number(body.detected)
  const averageCount = Number(body.averageCount)

  if (!Number.isFinite(detected) || detected < 0) {
    return NextResponse.json(
      { data: null, error: { message: "detected muss eine Zahl >= 0 sein." } },
      { status: 400 }
    )
  }

  if (!Number.isFinite(averageCount) || averageCount < 0) {
    return NextResponse.json(
      { data: null, error: { message: "averageCount muss eine Zahl >= 0 sein." } },
      { status: 400 }
    )
  }

  const snapshot = setChairStreamSnapshot({
    id: body.id ?? randomUUID(),
    capturedAt: body.capturedAt ?? new Date().toISOString(),
    image: body.image,
    detected: Math.round(detected),
    averageCount: Math.round(averageCount),
    detections: body.detections ?? [],
    source: "coco-ssd-chair-detector",
  })

  return NextResponse.json({
    data: snapshot,
    error: null,
  })
}
