import { getProjectRepository } from "@/lib/data"
import { buildProjektbericht } from "@/lib/export/bericht"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const repository = getProjectRepository()
  const { data } = await repository.getDashboardData(projectId)

  const markdown = buildProjektbericht(data)

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="wbk-projektbericht.md"`,
    },
  })
}
