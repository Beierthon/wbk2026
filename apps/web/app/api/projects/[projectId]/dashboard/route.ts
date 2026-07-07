import { RepositoryError, getProjectRepository } from "@/lib/data"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params

  try {
    const repository = getProjectRepository()
    const result = await repository.getDashboardData(projectId)

    return Response.json(result)
  } catch (error) {
    if (error instanceof RepositoryError) {
      return Response.json(
        {
          data: null,
          meta: null,
          error: {
            message: error.message,
          },
        },
        { status: error.status }
      )
    }

    return Response.json(
      {
        data: null,
        meta: null,
        error: {
          message: "Dashboard-Daten konnten nicht geladen werden.",
        },
      },
      { status: 500 }
    )
  }
}
