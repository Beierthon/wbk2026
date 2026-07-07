import { randomUUID } from "node:crypto"

import { RepositoryError, getProjectRepository } from "@/lib/data"
import { hasLiveKitServerEnv } from "@/lib/livekit/env"
import {
  createVisionAccessToken,
  type VisionLiveKitRole,
} from "@/lib/livekit/token"

interface TokenRequestBody {
  projectId?: string
  role?: VisionLiveKitRole
}

function isVisionRole(value: unknown): value is VisionLiveKitRole {
  return value === "publisher" || value === "viewer"
}

export async function POST(request: Request) {
  if (!hasLiveKitServerEnv()) {
    return Response.json(
      {
        data: null,
        error: {
          message:
            "LiveKit ist nicht konfiguriert. Setze LIVEKIT_API_KEY, LIVEKIT_API_SECRET und NEXT_PUBLIC_LIVEKIT_URL in Vercel.",
        },
      },
      { status: 503 }
    )
  }

  let body: TokenRequestBody

  try {
    body = (await request.json()) as TokenRequestBody
  } catch {
    return Response.json(
      {
        data: null,
        error: { message: "Ungueltiger JSON-Body." },
      },
      { status: 400 }
    )
  }

  const projectId = body.projectId?.trim()
  const role = body.role

  if (!projectId) {
    return Response.json(
      {
        data: null,
        error: { message: "projectId ist erforderlich." },
      },
      { status: 400 }
    )
  }

  if (!isVisionRole(role)) {
    return Response.json(
      {
        data: null,
        error: { message: "role muss publisher oder viewer sein." },
      },
      { status: 400 }
    )
  }

  try {
    const repository = getProjectRepository()
    await repository.getDashboardData(projectId)
  } catch (error) {
    if (error instanceof RepositoryError) {
      return Response.json(
        {
          data: null,
          error: { message: error.message },
        },
        { status: error.status }
      )
    }

    return Response.json(
      {
        data: null,
        error: { message: "Projekt konnte nicht validiert werden." },
      },
      { status: 500 }
    )
  }

  const identity = `${role}-${randomUUID()}`
  const { token, roomName } = await createVisionAccessToken({
    projectId,
    identity,
    role,
  })

  return Response.json({
    data: {
      token,
      url: process.env.NEXT_PUBLIC_LIVEKIT_URL,
      roomName,
      identity,
    },
    error: null,
  })
}
