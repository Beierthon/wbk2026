import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  ClockIcon,
  EuroIcon,
  Table2Icon,
} from "lucide-react"

import {
  ConflictSeverityBadge,
  ConflictStatusBadge,
  ForecastConfidenceBadge,
  MaterialStatusBadge,
} from "@/components/dashboard/status-badges"
import {
  formatEuroFromCent,
  formatGermanDate,
  formatGermanDateTime,
  formatQuantity,
} from "@/components/dashboard/formatters"
import type { ProjectDashboardData } from "@/lib/data/types"
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

export function DesignSystemExamples({ data }: { data: ProjectDashboardData }) {
  const kritischesMaterial =
    data.materialien.find((material) => material.status === "kritisch") ??
    data.materialien[0]
  const konflikt =
    data.konflikte.find((item) => item.status !== "geloest") ??
    data.konflikte[0]
  const kostenprognose = data.kostenprognosen[0]
  const aktivitaeten = data.aktivitaeten.slice(0, 4)
  const materialien = data.materialien.slice(0, 4)

  if (!kritischesMaterial || !konflikt || !kostenprognose) {
    return null
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            Designsystem-Beispiele
          </h2>
          <Badge variant="outline">#14</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Dichte Dashboard-Bausteine fuer KPI, Tabelle, Aktivitaetslog,
          Konfliktkarte und Kostenprognose.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="xl:col-span-1">
          <CardHeader className="gap-2">
            <div className="flex items-center justify-between gap-3">
              <CardDescription>KPI</CardDescription>
              <span className="rounded-md bg-construction p-1.5 text-construction-foreground">
                <ArrowUpRightIcon className="size-4" />
              </span>
            </div>
            <CardTitle className="font-mono text-2xl">
              {formatQuantity(
                kritischesMaterial.verbleibend,
                kritischesMaterial.einheit
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <MaterialStatusBadge status={kritischesMaterial.status} />
              <span className="break-words text-muted-foreground">
                {kritischesMaterial.name}
              </span>
            </div>
            <p className="break-words text-muted-foreground">
              Geplant{" "}
              {formatQuantity(
                kritischesMaterial.geplant,
                kritischesMaterial.einheit
              )}
              , verbaut{" "}
              {formatQuantity(
                kritischesMaterial.verbaut,
                kritischesMaterial.einheit
              )}
              .
            </p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader className="gap-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Materialtabelle</CardTitle>
                <CardDescription>
                  Kompakte Tabelle mit Mono-Zahlen und langen Materialnamen.
                </CardDescription>
              </div>
              <Table2Icon className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Geplant</TableHead>
                  <TableHead className="text-right">Verbaut</TableHead>
                  <TableHead className="text-right">Restwert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialien.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="max-w-56 font-medium whitespace-normal">
                      {material.name}
                    </TableCell>
                    <TableCell>
                      <MaterialStatusBadge status={material.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatQuantity(material.geplant, material.einheit)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatQuantity(material.verbaut, material.einheit)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatEuroFromCent(
                        material.verbleibend * material.kostenProEinheitCent
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Aktivitaetslog</CardTitle>
                <CardDescription>Projekt-Timeline</CardDescription>
              </div>
              <ClockIcon className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {aktivitaeten.map((aktivitaet) => (
              <div key={aktivitaet.id} className="grid gap-1 border-l pl-3">
                <p className="text-sm font-medium break-words">
                  {aktivitaet.titel}
                </p>
                <p className="text-xs break-words text-muted-foreground">
                  {aktivitaet.beschreibung}
                </p>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatGermanDateTime(aktivitaet.updatedAt)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Konfliktkarte</CardTitle>
                <CardDescription>{konflikt.verantwortlich}</CardDescription>
              </div>
              <span className="rounded-md bg-risk p-1.5 text-risk-foreground">
                <AlertTriangleIcon className="size-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <ConflictStatusBadge status={konflikt.status} />
              <ConflictSeverityBadge severity={konflikt.prioritaet} />
              {konflikt.faelligAm ? (
                <Badge variant="outline">
                  Faellig {formatGermanDate(konflikt.faelligAm)}
                </Badge>
              ) : null}
            </div>
            <p className="font-medium break-words">{konflikt.titel}</p>
            <p className="break-words text-muted-foreground">
              {konflikt.beschreibung}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Kostenprognose</CardTitle>
                <CardDescription>Forecast mit Annahmen</CardDescription>
              </div>
              <span className="rounded-md bg-cost p-1.5 text-cost-foreground">
                <EuroIcon className="size-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-2xl font-semibold">
                {formatEuroFromCent(kostenprognose.gesamtMehrkostenCent)}
              </span>
              <ForecastConfidenceBadge confidence={kostenprognose.konfidenz} />
            </div>
            <p className="font-mono text-muted-foreground">
              +{kostenprognose.zeitwirkungTage} Tage Zeitwirkung
            </p>
            <ul className="flex list-disc flex-col gap-1 pl-4 text-muted-foreground">
              {kostenprognose.annahmen.slice(0, 3).map((annahme) => (
                <li key={annahme} className="break-words">
                  {annahme}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
