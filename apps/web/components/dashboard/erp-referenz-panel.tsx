import {
  formatGermanDateTime,
} from "@/components/dashboard/formatters"
import { ErpSyncStatusBadge } from "@/components/dashboard/erp-sync-status-badge"
import type { ErpEapSnapshot } from "@/lib/erp"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

interface ErpReferenzPanelProps {
  snapshot: ErpEapSnapshot
  title?: string
  description?: string
  showLeistungswerte?: boolean
}

export function ErpReferenzPanel({
  snapshot,
  title = "ERP/EAP-Referenzen",
  description = "Externe IDs, Datenquelle und Synchronisationsstatus.",
  showLeistungswerte = false,
}: ErpReferenzPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{title}</CardTitle>
          <Badge variant="outline">{snapshot.systemLabel}</Badge>
          <Badge variant="secondary">
            Adapter: {snapshot.adapterSource}
          </Badge>
        </div>
        <CardDescription>
          {description} Abgerufen {formatGermanDateTime(snapshot.abgerufenAm)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border p-3">
            <p className="text-xs text-muted-foreground">Importiert</p>
            <p className="text-lg font-semibold">
              {snapshot.syncZusammenfassung.importiert}
            </p>
          </div>
          <div className="rounded-2xl border p-3">
            <p className="text-xs text-muted-foreground">Veraltet</p>
            <p className="text-lg font-semibold">
              {snapshot.syncZusammenfassung.veraltet}
            </p>
          </div>
          <div className="rounded-2xl border p-3">
            <p className="text-xs text-muted-foreground">Manuell</p>
            <p className="text-lg font-semibold">
              {snapshot.syncZusammenfassung.manuell_ueberschrieben}
            </p>
          </div>
          <div className="rounded-2xl border p-3">
            <p className="text-xs text-muted-foreground">Offen</p>
            <p className="text-lg font-semibold">
              {snapshot.syncZusammenfassung.nicht_synchronisiert}
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bezug</TableHead>
              <TableHead>System</TableHead>
              <TableHead>Externe ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Letzter Sync</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshot.referenzen.map(({ referenz, syncStatus, bezugLabel }) => (
              <TableRow key={referenz.id}>
                <TableCell className="font-medium">
                  {bezugLabel ?? referenz.objektTyp}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{referenz.systemName}</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {referenz.externerSchluessel}
                </TableCell>
                <TableCell>
                  <ErpSyncStatusBadge status={syncStatus} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {referenz.synchronisiertAm
                    ? formatGermanDateTime(referenz.synchronisiertAm)
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {showLeistungswerte && snapshot.leistungswerte.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Leistungswerte aus ERP/EAP</p>
            <div className="grid gap-3 md:grid-cols-3">
              {snapshot.leistungswerte.map((leistungswert) => (
                <div
                  key={leistungswert.label}
                  className="rounded-2xl border p-4"
                >
                  <p className="text-xs text-muted-foreground">
                    {leistungswert.label}
                  </p>
                  <p className="text-sm font-medium">{leistungswert.wert}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Quelle: {leistungswert.quelle.toUpperCase()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
