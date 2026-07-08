import { RepositoryError, getProjectRepository } from "@/lib/data"
import { hasLiveKitServerEnv } from "@/lib/livekit/env"
import { removeStalePublishers } from "@/lib/livekit/room-cleanup"

interface CleanupRequestBody {
  projectId?: string
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

  let body: CleanupRequestBody

  try {
    body = (await request.json()) as CleanupRequestBody
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

  if (!projectId) {
    return Response.json(
      {
        data: null,
        error: { message: "projectId ist erforderlich." },
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

  await removeStalePublishers(projectId)

  return Response.json({
    data: { cleaned: true },
    error: null,
  })
}
