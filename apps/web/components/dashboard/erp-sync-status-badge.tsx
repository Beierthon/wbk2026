import type { ErpEapSyncStatus } from "@workspace/domain"
import { Badge } from "@workspace/ui/components/badge"

const syncStatusLabels: Record<ErpEapSyncStatus, string> = {
  nicht_synchronisiert: "Nicht synchronisiert",
  veraltet: "Veraltet",
  manuell_ueberschrieben: "Manuell ueberschrieben",
  importiert: "Importiert",
}

function syncStatusVariant(
  status: ErpEapSyncStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "importiert":
      return "default"
    case "veraltet":
      return "destructive"
    case "manuell_ueberschrieben":
      return "secondary"
    case "nicht_synchronisiert":
      return "outline"
  }
}

export function ErpSyncStatusBadge({ status }: { status: ErpEapSyncStatus }) {
  return (
    <Badge variant={syncStatusVariant(status)}>{syncStatusLabels[status]}</Badge>
  )
}
