import { NextResponse } from "next/server"

import type { BaustellenFotoQuelle, VisionProjektkontext } from "@workspace/domain"

import { getDataSourceMode } from "@/lib/data"
import { applyVisionCapture } from "@/lib/vision/apply-capture"

interface VisionCaptureRequest {
  projectId?: string
  capturedAt?: string
  quelle?: BaustellenFotoQuelle
  kontext?: VisionProjektkontext
}

export async function POST(request: Request) {
  if (getDataSourceMode() !== "mock") {
    return NextResponse.json(
      {
        error: {
          message:
            "Baustellenfoto-Erfassung ist in der Demo nur im Mock-Datenmodus verfuegbar.",
        },
      },
      { status: 501 }
    )
  }

  const body = (await request.json()) as VisionCaptureRequest
  const projectId = body.projectId?.trim()
  const capturedAt = body.capturedAt ?? new Date().toISOString()
  const quelle = body.quelle ?? "camera"

  if (!projectId) {
    return NextResponse.json(
      {
        error: {
          message: "projectId ist erforderlich.",
        },
      },
      { status: 400 }
    )
  }

  const result = applyVisionCapture(projectId, capturedAt, quelle, body.kontext)

  return NextResponse.json({
    data: result,
    error: null,
  })
}
