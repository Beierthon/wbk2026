import { NextResponse } from "next/server"

import { getDataSourceMode } from "@/lib/data"
import {
  applyVisionConfirmation,
  type VisionConfirmationDetection,
} from "@/lib/vision/apply-confirmation"

interface VisionConfirmRequest {
  projectId?: string
  capturedAt?: string
  detections?: VisionConfirmationDetection[]
}

export async function POST(request: Request) {
  if (getDataSourceMode() !== "mock") {
    return NextResponse.json(
      {
        error: {
          message:
            "Vision-Bestaetigung ist in der Demo nur im Mock-Datenmodus verfuegbar.",
        },
      },
      { status: 501 }
    )
  }

  const body = (await request.json()) as VisionConfirmRequest
  const projectId = body.projectId?.trim()
  const capturedAt = body.capturedAt ?? new Date().toISOString()
  const detections = body.detections ?? []

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

  if (detections.length === 0) {
    return NextResponse.json(
      {
        error: {
          message: "Mindestens eine Erkennung ist fuer die Bestaetigung noetig.",
        },
      },
      { status: 400 }
    )
  }

  const result = applyVisionConfirmation(projectId, capturedAt, detections)

  return NextResponse.json({
    data: result,
    error: null,
  })
}
