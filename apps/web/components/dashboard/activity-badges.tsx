import type {
  ActivityKind,
  ExternalSystemKind,
  ProjectPhase,
} from "@workspace/domain"
import { Badge } from "@workspace/ui/components/badge"

const activityKindLabels: Record<ActivityKind, string> = {
  plan_veroeffentlicht: "Plan veroeffentlicht",
  konflikt_gemeldet: "Konflikt gemeldet",
  kommentar_erstellt: "Kommentar erstellt",
  entscheidung_getroffen: "Entscheidung getroffen",
  material_aktualisiert: "Material aktualisiert",
  asset_uebergeben: "Asset uebergeben",
  erp_eap_sync: "ERP/EAP Sync",
}

const phaseLabels: Record<ProjectPhase, string> = {
  planung: "Planung",
  bau: "Bau",
  betrieb: "Betrieb",
}

function activityKindVariant(
  art: ActivityKind
): "default" | "secondary" | "destructive" | "outline" {
  switch (art) {
    case "konflikt_gemeldet":
      return "destructive"
    case "plan_veroeffentlicht":
    case "entscheidung_getroffen":
      return "default"
    case "asset_uebergeben":
    case "material_aktualisiert":
      return "secondary"
    default:
      return "outline"
  }
}

export function ActivityKindBadge({ art }: { art: ActivityKind }) {
  return (
    <Badge variant={activityKindVariant(art)}>{activityKindLabels[art]}</Badge>
  )
}

export function ActivityPhaseBadge({ phase }: { phase: ProjectPhase }) {
  return <Badge variant="outline">{phaseLabels[phase]}</Badge>
}

export function formatActivitySource(
  quelle: ProjectPhase | ExternalSystemKind
) {
  if (isProjectPhase(quelle)) {
    return phaseLabels[quelle]
  }

  return quelle.toUpperCase()
}

export function isProjectPhase(
  value: ProjectPhase | ExternalSystemKind
): value is ProjectPhase {
  return value === "planung" || value === "bau" || value === "betrieb"
}
