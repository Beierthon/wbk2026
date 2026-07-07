import type {
  Aktivitaet,
  Kostenprognose,
  Material,
} from "@workspace/domain"

/** Escaped einen CSV-Wert nach RFC 4180 (Semikolon als Trennzeichen, DE). */
function csvCell(value: string | number): string {
  const text = String(value)
  if (/[";\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function toCsv(header: string[], rows: (string | number)[][]): string {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(";"))
  return lines.join("\r\n")
}

function euroFromCent(cent: number): string {
  return (cent / 100).toFixed(2).replace(".", ",")
}

export function materialToCsv(materialien: Material[]): string {
  return toCsv(
    [
      "Name",
      "Einheit",
      "Geplant",
      "Bestellt",
      "Geliefert",
      "Verbaut",
      "Verbleibend",
      "Status",
      "Kosten pro Einheit (EUR)",
    ],
    materialien.map((material) => [
      material.name,
      material.einheit,
      material.geplant,
      material.bestellt,
      material.geliefert,
      material.verbaut,
      material.verbleibend,
      material.status,
      euroFromCent(material.kostenProEinheitCent),
    ])
  )
}

export function kostenprognosenToCsv(prognosen: Kostenprognose[]): string {
  return toCsv(
    [
      "Material (EUR)",
      "Arbeit (EUR)",
      "Bauzeit (EUR)",
      "Betrieb (EUR)",
      "Gesamt (EUR)",
      "Zeitwirkung (Tage)",
      "Konfidenz",
    ],
    prognosen.map((prognose) => [
      euroFromCent(prognose.materialMehrkostenCent),
      euroFromCent(prognose.arbeitsMehrkostenCent),
      euroFromCent(prognose.bauzeitMehrkostenCent),
      euroFromCent(prognose.betriebMehrkostenCent),
      euroFromCent(prognose.gesamtMehrkostenCent),
      prognose.zeitwirkungTage,
      prognose.konfidenz,
    ])
  )
}

export function aktivitaetenToCsv(aktivitaeten: Aktivitaet[]): string {
  return toCsv(
    ["Zeitpunkt", "Art", "Quelle", "Ziel", "Titel", "Beschreibung"],
    aktivitaeten.map((aktivitaet) => [
      aktivitaet.createdAt,
      aktivitaet.art,
      aktivitaet.quelle,
      aktivitaet.ziel ?? "",
      aktivitaet.titel,
      aktivitaet.beschreibung,
    ])
  )
}

export type CsvEntitaet = "material" | "kostenprognosen" | "aktivitaeten"

export function isCsvEntitaet(value: string): value is CsvEntitaet {
  return (
    value === "material" ||
    value === "kostenprognosen" ||
    value === "aktivitaeten"
  )
}
