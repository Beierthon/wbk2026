import { RepositoryError } from "@/lib/data/errors"
import { getErpSyncSnapshot } from "@/lib/erp"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params

  try {
    const data = await getErpSyncSnapshot(projectId)

    return Response.json({
      data,
      error: null,
    })
  } catch (error) {
    if (error instanceof RepositoryError) {
      return Response.json(
        {
          data: null,
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
        error: {
          message: "ERP/EAP-Sync konnte nicht geladen werden.",
        },
      },
      { status: 500 }
    )
  }
}
