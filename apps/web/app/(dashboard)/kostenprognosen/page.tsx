import { ForecastConfidenceBadge } from "@/components/dashboard/status-badges"
import {
  formatEuroFromCent,
  formatGermanDateTime,
} from "@/components/dashboard/formatters"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

const kostenkategorien = [
  { key: "materialMehrkostenCent", label: "Material" },
  { key: "arbeitsMehrkostenCent", label: "Arbeit" },
  { key: "bauzeitMehrkostenCent", label: "Bauzeit" },
  { key: "betriebMehrkostenCent", label: "Betrieb" },
] as const

export default async function KostenprognosenPage() {
  const { data } = await projectRepository.getKostenprognosenUebersicht(
    WBK_DEMO_PROJECT_ID
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Kostenprognosen
          </h1>
          <Badge variant="secondary">{data.projekt.name}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Material-, Arbeits-, Bauzeit- und Betriebsmehrkosten aus Konflikten und
          Planabweichungen am Standort {data.standort.name}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Prognosen</CardDescription>
            <CardTitle className="text-base">
              {data.kostenprognosen.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Gesamt-Mehrkosten</CardDescription>
            <CardTitle className="text-base">
              {formatEuroFromCent(data.gesamtMehrkostenCent)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Zeitwirkung gesamt</CardDescription>
            <CardTitle className="text-base">
              +{data.gesamtZeitwirkungTage} Tage
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Standort</CardDescription>
            <CardTitle className="text-base">{data.standort.name}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kostenaufschluesselung</CardTitle>
          <CardDescription>
            Mehrkosten je Kategorie und verknuepfter Konflikt.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {data.kostenprognosen.map((prognose) => (
            <div key={prognose.id} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">
                  {prognose.konfliktTitel ?? "Kostenprognose"}
                </p>
                <ForecastConfidenceBadge confidence={prognose.konfidenz} />
                <span className="text-sm text-muted-foreground">
                  Aktualisiert {formatGermanDateTime(prognose.updatedAt)}
                </span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Mehrkosten</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kostenkategorien.map((kategorie) => (
                    <TableRow key={kategorie.key}>
                      <TableCell>{kategorie.label}</TableCell>
                      <TableCell>
                        {formatEuroFromCent(prognose[kategorie.key])}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">Gesamt</TableCell>
                    <TableCell className="font-medium">
                      {formatEuroFromCent(prognose.gesamtMehrkostenCent)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Zeitwirkung
                  </p>
                  <p className="text-sm">
                    +{prognose.zeitwirkungTage} Tage Bauzeit
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Annahmen
                  </p>
                  <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
                    {prognose.annahmen.map((annahme) => (
                      <li key={annahme}>{annahme}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
