import type { Material } from "@workspace/domain"

import type { ParsedErpImport } from "./types"

const MATERIAL_CSV_HEADERS = [
  "Name",
  "Unit",
  "Planned",
  "Ordered",
  "Delivered",
  "Installed",
  "Remaining",
  "Status",
  "Cost per unit (EUR)",
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
 * Parses material CSV in export format (#27) and maps rows to material IDs.
 */
export function parseMaterialCsvImport(
  raw: string,
  materialien: Material[]
): ParsedErpImport {
  const text = raw.replace(/^\uFEFF/, "").trim()
  if (!text) {
    throw new Error("The CSV file is empty.")
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length < 2) {
    throw new Error("The CSV file contains no data rows.")
  }

  const headerCells = parseCsvLine(lines[0]!)
  const headerIndex = new Map(
    headerCells.map((cell, index) => [normalizeHeader(cell), index])
  )

  if (!headerIndex.has("name")) {
    throw new Error('CSV header "Name" is missing.')
  }

  const nameById = new Map(
    materialien.map((material) => [material.name, material.id])
  )
  const rows: ParsedErpImport["rows"] = []

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line)
    const name = cells[headerIndex.get("name")!]?.trim()
    if (!name) {
      continue
    }

    const materialId = nameById.get(name)
    if (!materialId) {
      throw new Error(`Unknown material in CSV: "${name}".`)
    }

    rows.push({
      materialId,
      bestellt: parseGermanNumber(
        cells[headerIndex.get("ordered") ?? -1] ?? ""
      ),
      geliefert: parseGermanNumber(
        cells[headerIndex.get("delivered") ?? -1] ?? ""
      ),
      verbaut: parseGermanNumber(
        cells[headerIndex.get("installed") ?? -1] ?? ""
      ),
      verbleibend: parseGermanNumber(
        cells[headerIndex.get("remaining") ?? -1] ?? ""
      ),
      lager:
        parseGermanNumber(cells[headerIndex.get("lager") ?? -1] ?? "") ??
        parseGermanNumber(cells[headerIndex.get("bestand") ?? -1] ?? "") ??
        parseGermanNumber(cells[headerIndex.get("lagerbestand") ?? -1] ?? "") ??
        parseGermanNumber(cells[headerIndex.get("stock") ?? -1] ?? ""),
    })
  }

  if (rows.length === 0) {
    throw new Error("No importable material rows found.")
  }

  return { rows }
}

export { MATERIAL_CSV_HEADERS }
