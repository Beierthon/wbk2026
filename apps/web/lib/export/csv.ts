import type {
  Aktivitaet,
  Bauabschnitt,
  Kostenprognose,
  Material,
  TerminplanVerschiebung,
} from "@workspace/domain"

import type { ErpSyncRecord } from "@/lib/erp/types"

/** Escapes a CSV value per RFC 4180 (semicolon delimiter). */
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
      "Unit",
      "Planned",
      "Ordered",
      "Delivered",
      "Installed",
      "Remaining",
      "Lost",
      "Stolen",
      "Damaged",
      "Reordered",
      "Cost center",
      "Source",
      "Status",
      "Planned cost per unit (EUR)",
      "Cost per unit (EUR)",
    ],
    materialien.map((material) => [
      material.name,
      material.einheit,
      material.geplant,
      material.bestellt,
      material.geliefert,
      material.verbaut,
      material.verbleibend,
      material.verloren ?? 0,
      material.gestohlen ?? 0,
      material.beschaedigt ?? 0,
      material.nachbestellt ?? 0,
      material.kostenstelle ?? "",
      material.analyseQuelle ?? "",
      material.status,
      euroFromCent(
        material.planKostenProEinheitCent ?? material.kostenProEinheitCent
      ),
      euroFromCent(material.kostenProEinheitCent),
    ])
  )
}

export function kostenprognosenToCsv(prognosen: Kostenprognose[]): string {
  return toCsv(
    [
      "Material (EUR)",
      "Labour (EUR)",
      "Construction time (EUR)",
      "Operations (EUR)",
      "Total (EUR)",
      "Schedule impact (days)",
      "Confidence",
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
    ["Timestamp", "Type", "Source", "Target", "Title", "Description"],
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

export function erpSyncToCsv(datensaetze: ErpSyncRecord[]): string {
  return toCsv(
    [
      "System",
      "System name",
      "Object type",
      "External key",
      "Internal reference",
      "Label",
      "Synced at",
      "Status",
      "Note",
    ],
    datensaetze.map((record) => [
      record.system,
      record.systemName,
      record.objektTyp,
      record.externerSchluessel,
      record.interneReferenzId ?? "",
      record.interneBezeichnung,
      record.synchronisiertAm ?? "",
      record.status,
      record.hinweis ?? "",
    ])
  )
}

export function verschiebungenToCsv(
  verschiebungen: TerminplanVerschiebung[],
  bauabschnitte: Bauabschnitt[]
): string {
  const titelById = new Map(bauabschnitte.map((a) => [a.id, a.titel]))
  return toCsv(
    [
      "Date",
      "Construction phase",
      "Cause",
      "Strategy",
      "Days",
      "Reason",
      "Cumulative (days)",
      "Cost (EUR)",
    ],
    verschiebungen.map((v) => [
      v.createdAt.slice(0, 10),
      titelById.get(v.bauabschnittId) ?? v.bauabschnittId,
      v.ursache,
      v.strategie,
      v.tageVerschoben,
      v.grund,
      v.zeitwirkungKumuliertTage,
      v.kostenwirkungCent ? euroFromCent(v.kostenwirkungCent) : "",
    ])
  )
}

export type CsvEntitaet =
  | "material"
  | "kostenprognosen"
  | "aktivitaeten"
  | "erp"
  | "verschiebungen"

export function isCsvEntitaet(value: string): value is CsvEntitaet {
  return (
    value === "material" ||
    value === "kostenprognosen" ||
    value === "aktivitaeten" ||
    value === "erp" ||
    value === "verschiebungen"
  )
}
