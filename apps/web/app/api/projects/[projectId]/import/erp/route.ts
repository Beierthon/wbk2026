import { getProjectRepository } from "@/lib/data"
import { revalidateProjectCache } from "@/lib/cache/invalidate"
import { parseErpJsonImport } from "@/lib/import/parse-erp-json"
import { parseMaterialCsvImport } from "@/lib/import/parse-material-csv"
import { importiereErpMaterialien } from "@workspace/domain"

import { createMutationContext } from "@/lib/actions/context"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const contentType = request.headers.get("content-type") ?? ""

  let raw = ""
  let format: "csv" | "json" = "json"
  let quelleFromBody: string | undefined

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      format?: string
      quelle?: string
      materialien?: unknown
    }
    format = body.format === "csv" ? "csv" : "json"
    quelleFromBody = typeof body.quelle === "string" ? body.quelle : undefined
    raw =
      format === "json"
        ? JSON.stringify(body)
        : typeof body.materialien === "string"
          ? body.materialien
          : ""
  } else {
    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return Response.json({ error: "Datei fehlt." }, { status: 400 })
    }
    raw = await file.text()
    format = file.name.toLowerCase().endsWith(".json") ? "json" : "csv"
  }

  const repository = getProjectRepository()
  const { data } = await repository.getDashboardData(projectId)

  try {
    const parsed =
      format === "json"
        ? parseErpJsonImport(raw, data.materialien)
        : parseMaterialCsvImport(raw, data.materialien)

    const ctx = createMutationContext({
      actor: "ERP/EAP-Import",
      quelle: "erp",
    })
    const result = importiereErpMaterialien(
      {
        projektId: projectId,
        materialien: data.materialien,
        rows: parsed.rows,
        quelleName: parsed.quelle ?? quelleFromBody,
      },
      ctx
    )

    await repository.applyMutation(projectId, result)
    revalidateProjectCache(projectId)

    return Response.json({
      ok: true,
      importedCount: parsed.rows.length,
      message: `${parsed.rows.length} Materialposition(en) importiert.`,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Import fehlgeschlagen."
    return Response.json({ error: message }, { status: 400 })
  }
}
