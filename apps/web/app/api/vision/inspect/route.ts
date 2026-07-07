import { inspectVisionFrameMock } from "@workspace/domain/vision"
import { NextResponse } from "next/server"

import { getVisionMode } from "@/lib/vision/config"

import type { VisionInspectRequest } from "@workspace/domain/vision"

export async function POST(request: Request) {
  const body = (await request.json()) as VisionInspectRequest
  const mode = getVisionMode()

  if (mode === "live") {
    return NextResponse.json(
      {
        error:
          "Live-Vision ist noch nicht angebunden. Setze WBK_VISION_MODE=mock fuer die Demo.",
      },
      { status: 501 }
    )
  }

  try {
    const result = inspectVisionFrameMock(body)

    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { error: "Vision-Frame konnte nicht verarbeitet werden." },
      { status: 500 }
    )
  }
}
