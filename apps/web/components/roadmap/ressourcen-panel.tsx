import { formatGermanDate } from "@/components/dashboard/formatters"
import type { RoadmapUebersicht } from "@/lib/data/types"
import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

interface RessourcenPanelProps {
  uebersicht: RoadmapUebersicht
  selectedAbschnittId?: string
}

export function RessourcenPanel({
  uebersicht,
  selectedAbschnittId,
}: RessourcenPanelProps) {
  const zuordnungen = selectedAbschnittId
    ? uebersicht.bauabschnittMitarbeiter.filter(
        (z) => z.bauabschnittId === selectedAbschnittId
      )
    : uebersicht.bauabschnittMitarbeiter

  const mitarbeiterById = new Map(
    uebersicht.mitarbeiter.map((m) => [m.id, m])
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 text-sm font-medium">Mitarbeiter & Ausfälle</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Gewerk</TableHead>
              <TableHead>Stunden (Abschnitt)</TableHead>
              <TableHead>Ausfall</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zuordnungen.map((z) => {
              const ma = mitarbeiterById.get(z.mitarbeiterId)
              const ausfall = uebersicht.mitarbeiterAusfaelle.find(
                (a) => a.mitarbeiterId === z.mitarbeiterId
              )
              return (
                <TableRow key={z.id}>
                  <TableCell>{ma?.name ?? z.mitarbeiterId}</TableCell>
                  <TableCell>{ma?.rolle}</TableCell>
                  <TableCell>{ma?.gewerk}</TableCell>
                  <TableCell>{z.geplanteStunden}h</TableCell>
                  <TableCell>
                    {ausfall ? (
                      <Badge variant="destructive">
                        {ausfall.grund} {formatGermanDate(ausfall.von)}–
                        {formatGermanDate(ausfall.bis)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {uebersicht.planungskonflikte.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-medium">Erkannte Planungskonflikte</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {uebersicht.planungskonflikte.map((k, index) => (
              <li key={`${k.bauabschnittId}-${index}`} className="rounded-md border p-2">
                <Badge variant={k.schwere === "hoch" ? "destructive" : "secondary"}>
                  {k.typ}
                </Badge>
                <p className="mt-1 text-muted-foreground">{k.beschreibung}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
