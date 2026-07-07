import type { ErpSyncStatus } from "@/lib/erp"
import { Badge } from "@workspace/ui/components/badge"

const erpSyncStatusLabels: Record<ErpSyncStatus, string> = {
  synchronisiert: "Synchronisiert",
  veraltet: "Veraltet",
  nicht_synchronisiert: "Nicht synchronisiert",
  manuell_ueberschrieben: "Manuell ueberschrieben",
  importiert: "Importiert",
}

const erpSyncStatusVariants: Record<
  ErpSyncStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  synchronisiert: "default",
  veraltet: "secondary",
  nicht_synchronisiert: "outline",
  manuell_ueberschrieben: "destructive",
  importiert: "secondary",
}

export function ErpSyncStatusBadge({ status }: { status: ErpSyncStatus }) {
  return (
    <Badge variant={erpSyncStatusVariants[status]}>
      {erpSyncStatusLabels[status]}
    </Badge>
  )
}
