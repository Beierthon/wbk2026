import type {
  ConflictSeverity,
  ConflictStatus,
  DecisionStatus,
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

export function formatEuroFromCent(amountCent: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amountCent / 100)
}

export function formatGermanDate(value?: string) {
  if (!value) {
    return "—"
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

export function formatGermanDateTime(value?: string) {
  if (!value) {
    return "—"
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}
