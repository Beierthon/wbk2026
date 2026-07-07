import { ErpSyncStatusBadge } from "@/components/dashboard/erp-sync-badges"
import { formatGermanDateTime } from "@/components/dashboard/formatters"
import type { ErpSyncSnapshot } from "@/lib/erp"
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

const objektTypLabels = {
  material: "Material",
  bestellung: "Bestellung",
  kostenstelle: "Kostenstelle",
  asset: "Asset",
  wartung: "Wartung",
  leistungswert: "Leistungswert",
} as const

interface ErpSyncPanelProps {
  snapshot: ErpSyncSnapshot
  title?: string
  description?: string
  filter?: (record: ErpSyncSnapshot["datensaetze"][number]) => boolean
}

export function ErpSyncPanel({
  snapshot,
  title = "ERP/EAP-Synchronisation",
  description = "Datenquelle, Aktualitaetsstatus und externe Referenzen aus dem Adapter-Layer.",
  filter,
}: ErpSyncPanelProps) {
  const datensaetze = filter
    ? snapshot.datensaetze.filter(filter)
    : snapshot.datensaetze

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">Adapter: {snapshot.adapter}</Badge>
          <span className="text-muted-foreground">
            Stand: {formatGermanDateTime(snapshot.generiertAm)}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.systeme.map((system) => (
            <div
              key={`${system.system}-${system.systemName}`}
              className="flex flex-col gap-2 rounded-2xl border p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{system.systemName}</p>
                <Badge variant="secondary">{system.system.toUpperCase()}</Badge>
                <ErpSyncStatusBadge status={system.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {system.datensaetze} Datensaetze
                {system.letzteSynchronisation
                  ? ` · letzte Sync ${formatGermanDateTime(system.letzteSynchronisation)}`
                  : ""}
              </p>
            </div>
          ))}
        </div>

        {datensaetze.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keine ERP/EAP-Datensaetze fuer diesen Bereich.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objekt</TableHead>
                <TableHead>System</TableHead>
                <TableHead>Externe ID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datensaetze.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{record.interneBezeichnung}</span>
                      <span className="text-xs text-muted-foreground">
                        {objektTypLabels[record.objektTyp]}
                      </span>
                      {record.hinweis ? (
                        <span className="text-xs text-muted-foreground">
                          {record.hinweis}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{record.systemName}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {record.externerSchluessel}
                  </TableCell>
                  <TableCell>
                    <ErpSyncStatusBadge status={record.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
