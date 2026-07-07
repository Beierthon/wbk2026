import type {
  ActivityKind,
  ExternalSystemKind,
  ProjectPhase,
} from "@workspace/domain"
import { Badge } from "@workspace/ui/components/badge"

const activityKindLabels: Record<ActivityKind, string> = {
  plan_veroeffentlicht: "Plan veroeffentlicht",
  konflikt_gemeldet: "Konflikt gemeldet",
  konflikt_status_geaendert: "Konfliktstatus geaendert",
  kommentar_erstellt: "Kommentar erstellt",
  entscheidung_getroffen: "Entscheidung getroffen",
  material_aktualisiert: "Material aktualisiert",
  asset_uebergeben: "Asset uebergeben",
  wartung_geplant: "Wartung geplant",
  foto_erfasst: "Foto erfasst",
  abweichung_markiert: "Abweichung markiert",
  vision_bestaetigt: "Vision bestaetigt",
  erp_eap_sync: "ERP/EAP Sync",
  bauabschnitt_verschoben: "Bauabschnitt verschoben",
  bauabschnitt_blockiert: "Bauabschnitt blockiert",
  szenario_gewechselt: "Szenario gewechselt",
  terminplan_berechnet: "Terminplan berechnet",
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
    return "Kamera/Vision"
  }

  return quelle.toUpperCase()
}

export function isProjectPhase(
  value: ProjectPhase | ExternalSystemKind
): value is ProjectPhase {
  return value === "planung" || value === "bau" || value === "betrieb"
}
