import type {
  ActivityKind,
  ExternalSystemKind,
  ProjectPhase,
} from "@workspace/domain"
import { Badge } from "@workspace/ui/components/badge"

const activityKindLabels: Record<ActivityKind, string> = {
  plan_veroeffentlicht: "Plan published",
  konflikt_gemeldet: "Conflict reported",
  konflikt_status_geaendert: "Conflict status changed",
  kommentar_erstellt: "Comment added",
  entscheidung_getroffen: "Decision recorded",
  material_aktualisiert: "Material updated",
  asset_uebergeben: "Asset handed over",
  wartung_geplant: "Maintenance scheduled",
  foto_erfasst: "Photo captured",
  abweichung_markiert: "Deviation marked",
  vision_bestaetigt: "Vision confirmed",
  erp_eap_sync: "ERP/EAP sync",
  bauabschnitt_verschoben: "Construction phase shifted",
  bauabschnitt_blockiert: "Construction phase blocked",
  szenario_gewechselt: "Scenario switched",
  terminplan_berechnet: "Schedule calculated",
}

const phaseLabels: Record<ProjectPhase, string> = {
  planung: "Planning",
  bau: "Construction",
  betrieb: "Operations",
}

function activityKindVariant(
  art: ActivityKind
): "default" | "secondary" | "destructive" | "outline" {
  switch (art) {
    case "konflikt_gemeldet":
    case "abweichung_markiert":
      return "destructive"
    case "plan_veroeffentlicht":
    case "entscheidung_getroffen":
    case "vision_bestaetigt":
      return "default"
    case "asset_uebergeben":
    case "material_aktualisiert":
    case "wartung_geplant":
    case "konflikt_status_geaendert":
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

  if (quelle === "vision") {
    return "Camera/Vision"
  }

  return quelle.toUpperCase()
}

export function isProjectPhase(
  value: ProjectPhase | ExternalSystemKind
): value is ProjectPhase {
  return value === "planung" || value === "bau" || value === "betrieb"
}
