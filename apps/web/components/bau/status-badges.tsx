import type { MaterialStatus } from "@workspace/domain"
import type { Bestellung } from "@workspace/domain"
import { Badge } from "@workspace/ui/components/badge"

const materialStatusLabels: Record<MaterialStatus, string> = {
  geplant: "Geplant",
  bestellt: "Bestellt",
  geliefert: "Geliefert",
  verbaut: "Verbaut",
  kritisch: "Kritisch",
  verloren: "Verloren",
  gestohlen: "Gestohlen",
  beschaedigt: "Beschaedigt",
  nachgekauft: "Nachgekauft",
}

const bestellungStatusLabels: Record<Bestellung["status"], string> = {
  angefragt: "Angefragt",
  bestellt: "Bestellt",
  teilgeliefert: "Teilgeliefert",
  geliefert: "Geliefert",
  storniert: "Storniert",
}

function materialStatusVariant(
  status: MaterialStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "kritisch":
    case "verloren":
    case "gestohlen":
    case "beschaedigt":
      return "destructive"
    case "nachgekauft":
      return "secondary"
    case "verbaut":
    case "geliefert":
      return "default"
    default:
      return "outline"
  }
}

function bestellungStatusVariant(
  status: Bestellung["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "teilgeliefert":
      return "secondary"
    case "geliefert":
      return "default"
    case "storniert":
      return "destructive"
    default:
      return "outline"
  }
}

export function MaterialStatusBadge({ status }: { status: MaterialStatus }) {
  return (
    <Badge variant={materialStatusVariant(status)}>
      {materialStatusLabels[status]}
    </Badge>
  )
}

export function BestellungStatusBadge({
  status,
}: {
  status: Bestellung["status"]
}) {
  return (
    <Badge variant={bestellungStatusVariant(status)}>
      {bestellungStatusLabels[status]}
    </Badge>
  )
}

export {
  formatEuroFromCent,
  formatGermanDate,
  formatGermanDateTime,
} from "@/components/planung/status-badges"
