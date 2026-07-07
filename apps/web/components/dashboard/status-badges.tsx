import type {
  ConflictSeverity,
  ConflictStatus,
  DecisionStatus,
  MaterialStatus,
  PlanVersionStatus,
} from "@workspace/domain"
import { Badge } from "@workspace/ui/components/badge"

const conflictStatusLabels: Record<ConflictStatus, string> = {
  neu: "Neu",
  in_pruefung: "In Pruefung",
  entscheidung_noetig: "Entscheidung noetig",
  geloest: "Geloest",
  uebernommen: "Uebernommen",
}

const conflictSeverityLabels: Record<ConflictSeverity, string> = {
  niedrig: "Niedrig",
  mittel: "Mittel",
  hoch: "Hoch",
  kritisch: "Kritisch",
}

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

const bestellungStatusLabels = {
  angefragt: "Angefragt",
  bestellt: "Bestellt",
  teilgeliefert: "Teilgeliefert",
  geliefert: "Geliefert",
  storniert: "Storniert",
} as const

type BestellungStatus = keyof typeof bestellungStatusLabels

const planVersionStatusLabels: Record<PlanVersionStatus, string> = {
  entwurf: "Entwurf",
  zur_pruefung: "Zur Pruefung",
  freigegeben: "Freigegeben",
  ersetzt: "Ersetzt",
}

const decisionStatusLabels: Record<DecisionStatus, string> = {
  vorgeschlagen: "Vorgeschlagen",
  freigegeben: "Freigegeben",
  abgelehnt: "Abgelehnt",
}

function planVersionVariant(
  status: PlanVersionStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "freigegeben":
      return "default"
    case "zur_pruefung":
      return "secondary"
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

export function BestellungStatusBadge({ status }: { status: BestellungStatus }) {
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
    <Badge variant={decisionVariant(status)}>{decisionStatusLabels[status]}</Badge>
  )
}
