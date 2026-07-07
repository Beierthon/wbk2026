import { NextResponse } from "next/server"

import { analyzeVisionImage } from "@/lib/vision/analyze-image"
import type { VisionInspectRequest } from "@/lib/vision/types"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VisionInspectRequest
    const result = await analyzeVisionImage({
      ...body,
      mode: body.mode ?? "scan",
      expectedItems: body.expectedItems ?? [],
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Vision-Analyse konnte nicht ausgefuehrt werden.",
        },
      },
      { status: 500 }
    )
  }
}
