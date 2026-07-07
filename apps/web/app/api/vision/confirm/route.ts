import { NextResponse } from "next/server"

import { getDataSourceMode } from "@/lib/data"
import {
  applyChairCountConfirmation,
  applyVisionConfirmation,
  type VisionConfirmationDetection,
} from "@/lib/vision/apply-confirmation"

interface VisionConfirmRequest {
  projectId?: string
  capturedAt?: string
  detections?: VisionConfirmationDetection[]
  chairCount?: number
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
  const chairCount =
    typeof body.chairCount === "number"
      ? Math.round(body.chairCount)
      : undefined

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

  if (typeof chairCount === "number") {
    if (!Number.isFinite(chairCount) || chairCount < 1) {
      return NextResponse.json(
        {
          error: {
            message:
              "chairCount muss mindestens 1 sein, damit eine Stuhlerkennung bestaetigt werden kann.",
          },
        },
        { status: 400 }
      )
    }

    const result = applyChairCountConfirmation(
      projectId,
      capturedAt,
      chairCount
    )

    return NextResponse.json({
      data: result,
      error: null,
    })
  }

  if (detections.length === 0) {
    return NextResponse.json(
      {
        error: {
          message: "At least one detection is required for confirmation.",
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
