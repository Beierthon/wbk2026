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
 * Parst ERP/EAP-Mock-JSON (#27) mit materialId oder name als Schlüssel.
 */
export function parseErpJsonImport(
  raw: string,
  materialien: Material[]
): ParsedErpImport {
  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    throw new Error("Die JSON-Datei ist ungültig.")
  }

  if (!isRecord(payload) || !Array.isArray(payload.materialien)) {
    throw new Error('JSON muss ein Objekt mit Feld „materialien" (Array) sein.')
  }

  const typed = payload as unknown as ErpJsonImportPayload
  const nameById = new Map(materialien.map((material) => [material.name, material.id]))
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
            : "unbekannt"
      throw new Error(`Unbekanntes Material in JSON: „${label}".`)
    }

    rows.push({
      materialId,
      bestellt: parseOptionalNumber(entry.bestellt),
      geliefert: parseOptionalNumber(entry.geliefert),
      verbaut: parseOptionalNumber(entry.verbaut),
      verbleibend: parseOptionalNumber(entry.verbleibend),
    })
  }

  if (rows.length === 0) {
    throw new Error("Keine importierbaren Materialzeilen in JSON gefunden.")
  }

  return {
    quelle: typeof typed.quelle === "string" ? typed.quelle : undefined,
    rows,
  }
}
