import type {
  AssetStatus,
  ConflictSeverity,
  ConflictStatus,
  DecisionStatus,
  ForecastConfidence,
  MaterialStatus,
  PlanVersionStatus,
  WartungsaufgabeQuelle,
  WartungsaufgabeStatus,
} from "@workspace/domain"
import { Badge } from "@workspace/ui/components/badge"

const conflictStatusLabels: Record<ConflictStatus, string> = {
  neu: "New",
  in_pruefung: "Under review",
  entscheidung_noetig: "Decision required",
  geloest: "Resolved",
  uebernommen: "Adopted",
}

const conflictSeverityLabels: Record<ConflictSeverity, string> = {
  niedrig: "Low",
  mittel: "Medium",
  hoch: "High",
  kritisch: "Critical",
}

const materialStatusLabels: Record<MaterialStatus, string> = {
  geplant: "Planned",
  bestellt: "Ordered",
  geliefert: "Delivered",
  verbaut: "Installed",
  kritisch: "Critical",
  verloren: "Lost",
  gestohlen: "Stolen",
  beschaedigt: "Damaged",
  nachgekauft: "Reordered",
}

const assetStatusLabels: Record<AssetStatus, string> = {
  geplant: "Planned",
  im_bau: "Under construction",
  uebergeben: "Handed over",
  wartung_offen: "Maintenance pending",
  in_betrieb: "In operation",
}

const bestellungStatusLabels = {
  angefragt: "Requested",
  bestellt: "Ordered",
  teilgeliefert: "Partially delivered",
  geliefert: "Delivered",
  storniert: "Cancelled",
} as const

const planVersionStatusLabels: Record<PlanVersionStatus, string> = {
  entwurf: "Draft",
  zur_pruefung: "Under review",
  freigegeben: "Approved",
  ersetzt: "Superseded",
}

const decisionStatusLabels: Record<DecisionStatus, string> = {
  vorgeschlagen: "Proposed",
  freigegeben: "Approved",
  abgelehnt: "Rejected",
}

const forecastConfidenceLabels: Record<ForecastConfidence, string> = {
  niedrig: "Low",
  mittel: "Medium",
  hoch: "High",
}

const wartungsaufgabeStatusLabels: Record<WartungsaufgabeStatus, string> = {
  offen: "Open",
  geplant: "Planned",
  erledigt: "Done",
}

const wartungsaufgabeQuelleLabels: Record<WartungsaufgabeQuelle, string> = {
  planung: "Planning",
  bau: "Construction",
  entscheidung: "Decision",
  erp: "ERP",
}

const uebergabeChecklistenStatusLabels = {
  offen: "Open",
  in_pruefung: "In review",
  erledigt: "Done",
} as const

type UebergabeChecklistenStatus = keyof typeof uebergabeChecklistenStatusLabels

type BestellungStatus = keyof typeof bestellungStatusLabels

function conflictStatusVariant(
  status: ConflictStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "entscheidung_noetig":
      return "destructive"
    case "in_pruefung":
      return "secondary"
    case "geloest":
    case "uebernommen":
      return "outline"
    default:
      return "default"
  }
}

function severityVariant(
  severity: ConflictSeverity
): "default" | "secondary" | "destructive" | "outline" {
  switch (severity) {
    case "kritisch":
    case "hoch":
      return "destructive"
    case "mittel":
      return "secondary"
    default:
      return "outline"
  }
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
    case "bestellt":
    case "geliefert":
    case "nachgekauft":
      return "secondary"
    case "verbaut":
      return "default"
    default:
      return "outline"
  }
}

function assetStatusVariant(
  status: AssetStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "wartung_offen":
      return "destructive"
    case "uebergeben":
    case "in_betrieb":
      return "default"
    case "im_bau":
      return "secondary"
    default:
      return "outline"
  }
}

function bestellungStatusVariant(
  status: BestellungStatus
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

function planVersionVariant(
  status: PlanVersionStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "freigegeben":
      return "default"
    case "zur_pruefung":
      return "secondary"
    case "ersetzt":
      return "outline"
    default:
      return "outline"
  }
}

function decisionVariant(
  status: DecisionStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "freigegeben":
      return "default"
    case "vorgeschlagen":
      return "secondary"
    default:
      return "destructive"
  }
}

function forecastConfidenceVariant(
  confidence: ForecastConfidence
): "default" | "secondary" | "destructive" | "outline" {
  switch (confidence) {
    case "hoch":
      return "default"
    case "mittel":
      return "secondary"
    default:
      return "outline"
  }
}

export function ConflictStatusBadge({ status }: { status: ConflictStatus }) {
  return (
    <Badge variant={conflictStatusVariant(status)}>
      {conflictStatusLabels[status]}
    </Badge>
  )
}

export function ConflictSeverityBadge({
  severity,
}: {
  severity: ConflictSeverity
}) {
  return (
    <Badge variant={severityVariant(severity)}>
      {conflictSeverityLabels[severity]}
    </Badge>
  )
}

export function MaterialStatusBadge({ status }: { status: MaterialStatus }) {
  return (
    <Badge variant={materialStatusVariant(status)}>
      {materialStatusLabels[status]}
    </Badge>
  )
}

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return (
    <Badge variant={assetStatusVariant(status)}>
      {assetStatusLabels[status]}
    </Badge>
  )
}

export function BestellungStatusBadge({
  status,
}: {
  status: BestellungStatus
}) {
  return (
    <Badge variant={bestellungStatusVariant(status)}>
      {bestellungStatusLabels[status]}
    </Badge>
  )
}

export function PlanVersionStatusBadge({
  status,
}: {
  status: PlanVersionStatus
}) {
  return (
    <Badge variant={planVersionVariant(status)}>
      {planVersionStatusLabels[status]}
    </Badge>
  )
}

export function DecisionStatusBadge({ status }: { status: DecisionStatus }) {
  return (
    <Badge variant={decisionVariant(status)}>
      {decisionStatusLabels[status]}
    </Badge>
  )
}

export function ForecastConfidenceBadge({
  confidence,
}: {
  confidence: ForecastConfidence
}) {
  return (
    <Badge variant={forecastConfidenceVariant(confidence)}>
      {forecastConfidenceLabels[confidence]}
    </Badge>
  )
}

function wartungsaufgabeStatusVariant(
  status: WartungsaufgabeStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "offen":
      return "destructive"
    case "geplant":
      return "secondary"
    default:
      return "outline"
  }
}

function uebergabeChecklistenStatusVariant(
  status: UebergabeChecklistenStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "erledigt":
      return "default"
    case "in_pruefung":
      return "secondary"
    default:
      return "outline"
  }
}

export function WartungsaufgabeStatusBadge({
  status,
}: {
  status: WartungsaufgabeStatus
}) {
  return (
    <Badge variant={wartungsaufgabeStatusVariant(status)}>
      {wartungsaufgabeStatusLabels[status]}
    </Badge>
  )
}

export function WartungsaufgabeQuelleBadge({
  quelle,
}: {
  quelle: WartungsaufgabeQuelle
}) {
  return <Badge variant="outline">{wartungsaufgabeQuelleLabels[quelle]}</Badge>
}

export function UebergabeChecklistenStatusBadge({
  status,
}: {
  status: UebergabeChecklistenStatus
}) {
  return (
    <Badge variant={uebergabeChecklistenStatusVariant(status)}>
      {uebergabeChecklistenStatusLabels[status]}
    </Badge>
  )
}
