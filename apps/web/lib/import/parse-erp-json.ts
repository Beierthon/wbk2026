import type { Material } from "@workspace/domain"

import type { ErpJsonImportPayload, ParsedErpImport } from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."))
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

/**
 * Parses ERP/EAP mock JSON (#27) with materialId or name as key.
 */
export function parseErpJsonImport(
  raw: string,
  materialien: Material[]
): ParsedErpImport {
  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    throw new Error("The JSON file is invalid.")
  }

  if (!isRecord(payload) || !Array.isArray(payload.materialien)) {
    throw new Error('JSON must be an object with a "materialien" array field.')
  }

  const typed = payload as unknown as ErpJsonImportPayload
  const nameById = new Map(
    materialien.map((material) => [material.name, material.id])
  )
  const idSet = new Set(materialien.map((material) => material.id))
  const rows: ParsedErpImport["rows"] = []

  for (const entry of typed.materialien) {
    if (!isRecord(entry)) {
      continue
    }

    const materialId =
      typeof entry.materialId === "string" && idSet.has(entry.materialId)
        ? entry.materialId
        : typeof entry.name === "string"
          ? nameById.get(entry.name)
          : undefined

    if (!materialId) {
      const label =
        typeof entry.materialId === "string"
          ? entry.materialId
          : typeof entry.name === "string"
            ? entry.name
            : "unknown"
      throw new Error(`Unknown material in JSON: "${label}".`)
    }

    rows.push({
      materialId,
      bestellt: parseOptionalNumber(entry.bestellt),
      geliefert: parseOptionalNumber(entry.geliefert),
      verbaut: parseOptionalNumber(entry.verbaut),
      verbleibend: parseOptionalNumber(entry.verbleibend),
      lager:
        parseOptionalNumber(entry.lager) ??
        parseOptionalNumber(entry.lagerbestand) ??
        parseOptionalNumber(entry.bestand),
    })
  }

  if (rows.length === 0) {
    throw new Error("No importable material rows found in JSON.")
  }

  return {
    quelle: typeof typed.quelle === "string" ? typed.quelle : undefined,
    rows,
  }
}
