"use server"

import { importiereErpMaterialien } from "@workspace/domain"
import { revalidatePath } from "next/cache"

import { createMutationContext } from "@/lib/actions/context"
import { getDataSourceMode } from "@/lib/data"
import { getProjectRepository } from "@/lib/data"
import { parseErpJsonImport } from "@/lib/import/parse-erp-json"
import { parseMaterialCsvImport } from "@/lib/import/parse-material-csv"
import { getActiveProjectId } from "@/lib/project"

const repository = getProjectRepository()

export interface ImportErpResult {
  ok: boolean
  message: string
  importedCount?: number
}

export async function importErpMaterialAction(
  formData: FormData
): Promise<ImportErpResult> {
  if (getDataSourceMode() !== "mock") {
    return {
      ok: false,
      message:
        "ERP/EAP import is available in demo mode (WBK_DATA_SOURCE=mock). Not yet active in Supabase mode.",
    }
  }

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Please select a CSV or JSON file." }
  }

  if (file.size > 512_000) {
    return { ok: false, message: "The file is too large (max. 512 KB)." }
  }

  const projektId = await getActiveProjectId()
  const { data } = await repository.getDashboardData(projektId)
  const raw = await file.text()
  const format =
    (formData.get("format") as string | null) ?? inferFormat(file.name)

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
        projektId,
        materialien: data.materialien,
        rows: parsed.rows,
        quelleName: parsed.quelle,
      },
      ctx
    )

    await repository.applyMutation(projektId, result)
    revalidatePath("/", "layout")

    return {
      ok: true,
      message: `${parsed.rows.length} material line(s) imported.`,
      importedCount: parsed.rows.length,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed."
    return { ok: false, message }
  }
}

function inferFormat(filename: string): "csv" | "json" {
  return filename.toLowerCase().endsWith(".json") ? "json" : "csv"
}
