import type { Material } from "@workspace/domain"

import type { ParsedErpImport } from "./types"

const MATERIAL_CSV_HEADERS = [
  "Name",
  "Einheit",
  "Geplant",
  "Bestellt",
  "Geliefert",
  "Verbaut",
  "Verbleibend",
  "Status",
  "Kosten pro Einheit (EUR)",
] as const

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === ";" && !inQuotes) {
      cells.push(current)
      current = ""
      continue
    }
    current += char
  }
  cells.push(current)
  return cells
}

function parseGermanNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }
  const normalized = trimmed.replace(/\./g, "").replace(",", ".")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Parst Material-CSV im Export-Format (#27) und mappt Zeilen auf Material-IDs.
 */
export function parseMaterialCsvImport(
  raw: string,
  materialien: Material[]
): ParsedErpImport {
  const text = raw.replace(/^\uFEFF/, "").trim()
  if (!text) {
    throw new Error("Die CSV-Datei ist leer.")
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length < 2) {
    throw new Error("Die CSV-Datei enthält keine Datenzeilen.")
  }

  const headerCells = parseCsvLine(lines[0]!)
  const headerIndex = new Map(
    headerCells.map((cell, index) => [normalizeHeader(cell), index])
  )

  if (!headerIndex.has("name")) {
    throw new Error("CSV-Header „Name“ fehlt.")
  }

  const nameById = new Map(materialien.map((material) => [material.name, material.id]))
  const rows: ParsedErpImport["rows"] = []

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line)
    const name = cells[headerIndex.get("name")!]?.trim()
    if (!name) {
      continue
    }

    const materialId = nameById.get(name)
    if (!materialId) {
      throw new Error(`Unbekanntes Material in CSV: „${name}“.`)
    }

    rows.push({
      materialId,
      bestellt: parseGermanNumber(cells[headerIndex.get("bestellt") ?? -1] ?? ""),
      geliefert: parseGermanNumber(cells[headerIndex.get("geliefert") ?? -1] ?? ""),
      verbaut: parseGermanNumber(cells[headerIndex.get("verbaut") ?? -1] ?? ""),
      verbleibend: parseGermanNumber(
        cells[headerIndex.get("verbleibend") ?? -1] ?? ""
      ),
    })
  }

  if (rows.length === 0) {
    throw new Error("Keine importierbaren Materialzeilen gefunden.")
  }

  return { rows }
}

export { MATERIAL_CSV_HEADERS }
