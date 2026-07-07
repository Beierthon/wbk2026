import { NextResponse } from "next/server"

import { RepositoryError } from "@/lib/data"
import {
  inspectVisionFrame,
  type VisionInspectApiRequest,
} from "@/lib/vision/inspect-frame"

const REQUEST_TIMEOUT_MS = 8_000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new RepositoryError(
          "Vision-Scan hat zu lange gedauert. Bitte erneut versuchen.",
          504
        )
      )
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timeoutId)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VisionInspectApiRequest
    const result = await withTimeout(inspectVisionFrame(body), REQUEST_TIMEOUT_MS)

    return NextResponse.json({
      data: result,
      error: null,
    })
  } catch (error) {
    if (error instanceof RepositoryError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: error.message,
          },
        },
        { status: error.status }
      )
    }

    return NextResponse.json(
      {
        data: null,
        error: {
          message: "Vision-Frame konnte nicht verarbeitet werden.",
        },
      },
      { status: 500 }
    )
  }
}
