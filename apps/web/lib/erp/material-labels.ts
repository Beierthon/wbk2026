import type { Material } from "@workspace/domain"

const EINHEIT_LABELS: Record<Material["einheit"], string> = {
  stueck: "Stk.",
  m: "m",
  m2: "m²",
  m3: "m³",
  kg: "kg",
  t: "t",
}

const STATUS_LABELS: Record<Material["status"], string> = {
  geplant: "Geplant",
  bestellt: "Bestellt",
  geliefert: "Geliefert",
  verbaut: "Verbaut",
  kritisch: "Kritisch",
  verloren: "Verloren",
  gestohlen: "Gestohlen",
  beschaedigt: "Beschädigt",
  nachgekauft: "Nachgekauft",
}

export function formatMaterialEinheit(einheit: Material["einheit"]) {
  return EINHEIT_LABELS[einheit]
}

export function formatMaterialStatus(status: Material["status"]) {
  return STATUS_LABELS[status]
}

export function formatMaterialMenge(
  value: number,
  einheit: Material["einheit"]
) {
  return `${new Intl.NumberFormat("de-DE").format(value)} ${formatMaterialEinheit(einheit)}`
}
