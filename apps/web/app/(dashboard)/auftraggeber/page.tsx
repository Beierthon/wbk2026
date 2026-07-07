import Link from "next/link"

import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import {
  formatDisplayDate,
  formatEuroFromCent,
} from "@/components/dashboard/formatters"
import { PageHeader } from "@/components/layout/page-header"
import { ListRow, SectionCard } from "@/components/layout/section-card"
import { StatStrip } from "@/components/layout/stat-strip"
import { projectRepository } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default function AuftraggeberPage() {
  return (
    <ActiveProjectBoundary>
      {(projectId) => <AuftraggeberContent projectId={projectId} />}
    </ActiveProjectBoundary>
  )
}

async function AuftraggeberContent({ projectId }: { projectId: string }) {
  const { data } = await projectRepository.getDashboardData(projectId)

  const mehrkostenCent = data.kostenprognosen.reduce(
    (sum, prognose) => sum + prognose.gesamtMehrkostenCent,
    0
  )
  const zeitwirkungTage = data.konflikte.reduce(
    (sum, konflikt) => sum + (konflikt.zeitwirkungTage ?? 0),
    0
  )
  const kritischeKonflikte = data.konflikte.filter(
    (konflikt) => konflikt.prioritaet === "kritisch"
  )
  const offeneEntscheidungen = data.entscheidungen.filter(
    (entscheidung) => entscheidung.status !== "freigegeben"
  )

  const notifications = [
    {
      title: "Budget",
      value: formatEuroFromCent(mehrkostenCent),
      detail:
        mehrkostenCent > 0
          ? "Mehrkostenprognose gegen aktuelles Budget."
          : "Keine Mehrkostenprognose offen.",
      tone: mehrkostenCent > 0 ? "alert" : "default",
    },
    {
      title: "Verzögerung",
      value: `${zeitwirkungTage} Tage`,
      detail:
        zeitwirkungTage > 0
          ? "Terminwirkung aus offenen Bau- und Plan-Konflikten."
          : "Keine relevante Verzögerung gemeldet.",
      tone: zeitwirkungTage > 0 ? "signal" : "default",
    },
    {
      title: "Kritische Themen",
      value: kritischeKonflikte.length,
      detail: "Nur Punkte mit direkter Budget-, Termin- oder Abnahmewirkung.",
      tone: kritischeKonflikte.length > 0 ? "alert" : "default",
    },
  ] as const

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Auftraggeber"
        badge={
          <>
            <Badge variant="secondary">{data.projekt.name}</Badge>
            <Badge variant="outline">{data.projekt.status}</Badge>
          </>
        }
      />

      <StatStrip
        items={[
          {
            label: "Budget",
            value: formatEuroFromCent(data.projekt.budgetCent),
            hint: `Übergabe ${formatDisplayDate(data.projekt.geplanteUebergabe)}`,
          },
          {
            label: "Prognose",
            value: formatEuroFromCent(mehrkostenCent),
            tone: mehrkostenCent > 0 ? "alert" : "ok",
          },
          {
            label: "Verzögerung",
            value: `${zeitwirkungTage} Tage`,
            tone: zeitwirkungTage > 0 ? "signal" : "ok",
          },
          {
            label: "Offene Entscheidungen",
            value: offeneEntscheidungen.length,
            tone: offeneEntscheidungen.length > 0 ? "signal" : "default",
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
        <SectionCard
          title="Übersicht"
          titleHint="Nur Budget-, Termin- und Freigabethemen für den Auftraggeber."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {notifications.map((item) => (
              <div
                key={item.title}
                className="rounded-md border bg-background p-4"
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-3 font-mono text-2xl font-semibold">
                  {item.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Aktionen" compact>
          <div className="grid gap-2">
            <Button
              size="lg"
              variant="outline"
              className="justify-start"
              render={<Link href="/kostenprognosen" />}
            >
              Kostenprognose
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="justify-start"
              render={<Link href="/roadmap" />}
            >
              Terminplan
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="justify-start"
              render={<Link href="/aktivitaeten" />}
            >
              Audit Trail
            </Button>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Aktuelle Meldungen">
        <div className="flex flex-col gap-3">
          {data.konflikte.slice(0, 4).map((konflikt) => (
            <ListRow
              key={konflikt.id}
              tone={konflikt.prioritaet === "kritisch" ? "alert" : "signal"}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{konflikt.titel}</p>
                <Badge variant="outline">{konflikt.status}</Badge>
                <Badge
                  variant={
                    konflikt.prioritaet === "kritisch"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {konflikt.prioritaet}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {konflikt.beschreibung}
              </p>
            </ListRow>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
