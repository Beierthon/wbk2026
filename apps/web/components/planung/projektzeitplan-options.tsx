"use client"

import { useState, type ComponentType } from "react"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  PackagePlus,
  ShieldAlert,
} from "lucide-react"

import { SectionCard } from "@/components/layout/section-card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type PlanId = "restock" | "continue"

type LaneStep = {
  id: string
  lane: "System" | "Logistik" | "Bauausfuehrung" | "Qualitaet"
  title: string
  detail: string
  week: string
  tone: "neutral" | "alert" | "wait" | "ok" | "risk"
}

type PlanOption = {
  id: PlanId
  title: string
  subtitle: string
  impact: string
  icon: ComponentType<{ className?: string }>
  steps: LaneStep[]
}

const lanes: LaneStep["lane"][] = [
  "System",
  "Logistik",
  "Bauausfuehrung",
  "Qualitaet",
]

const options: PlanOption[] = [
  {
    id: "restock",
    title: "Nachbestellen und Ablauf verschieben",
    subtitle:
      "Material wird automatisch geordert, Folgearbeiten warten auf Lieferung.",
    impact: "+4 Tage, volle Qualitaet gesichert",
    icon: PackagePlus,
    steps: [
      {
        id: "shortage",
        lane: "System",
        title: "Engpass erkannt",
        detail: "Lagerbestand reicht fuer Montageabschnitt B nicht aus.",
        week: "Heute",
        tone: "alert",
      },
      {
        id: "order",
        lane: "Logistik",
        title: "Nachkauf ausloesen",
        detail: "ERP legt Bestellung an und blockt den Bedarf.",
        week: "Tag 1",
        tone: "wait",
      },
      {
        id: "delivery",
        lane: "Logistik",
        title: "Lieferung abwarten",
        detail: "Wareneingang und Sichtpruefung vor Montage.",
        week: "Tag 4",
        tone: "wait",
      },
      {
        id: "assembly",
        lane: "Bauausfuehrung",
        title: "Montage neu takten",
        detail: "Folgeprojekte starten nach gesichertem Material.",
        week: "Tag 5",
        tone: "ok",
      },
      {
        id: "quality",
        lane: "Qualitaet",
        title: "Abnahme ohne Einschraenkung",
        detail: "Planstatus bleibt voll erfuellt.",
        week: "Tag 6",
        tone: "ok",
      },
    ],
  },
  {
    id: "continue",
    title: "Plan beibehalten und Risiko markieren",
    subtitle:
      "Team arbeitet weiter, aber alle Folgeschritte erhalten Warnstatus.",
    impact: "Zeitplan bleibt, Qualitaet nicht voll gesichert",
    icon: ShieldAlert,
    steps: [
      {
        id: "shortage",
        lane: "System",
        title: "Engpass erkannt",
        detail: "Lagerbestand reicht fuer Montageabschnitt B nicht aus.",
        week: "Heute",
        tone: "alert",
      },
      {
        id: "continue",
        lane: "Bauausfuehrung",
        title: "Montage fortsetzen",
        detail: "Aktueller Takt bleibt unveraendert.",
        week: "Tag 1",
        tone: "risk",
      },
      {
        id: "fitout",
        lane: "Bauausfuehrung",
        title: "Folgeprojekt vorziehen",
        detail: "Innenausbau laeuft mit Materialvorbehalt.",
        week: "Tag 2",
        tone: "risk",
      },
      {
        id: "quality-risk",
        lane: "Qualitaet",
        title: "Erfuellung eingeschraenkt",
        detail: "Status gelb: volle Qualitaet ist nicht garantiert.",
        week: "Tag 3",
        tone: "risk",
      },
      {
        id: "review",
        lane: "System",
        title: "Nachpruefung planen",
        detail: "Entscheidung bleibt im Protokoll sichtbar.",
        week: "Tag 4",
        tone: "neutral",
      },
    ],
  },
]

const toneClasses: Record<LaneStep["tone"], string> = {
  neutral: "border-border bg-card text-card-foreground",
  alert:
    "border-red-300 bg-red-50 text-red-950 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100",
  wait: "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
  ok: "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  risk: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
}

export function ProjektzeitplanOptions() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("restock")

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        title="Push-Benachrichtigung"
        titleHint="Diese Meldung erscheint nach dem bestaetigten Systemscan."
        compact
      >
        <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-medium">Zu wenig Lagerbestand erkannt</p>
              <p className="text-sm opacity-80">
                Waehle eine Massnahme fuer den weiteren Projektablauf.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-300 bg-white/60">
            Entscheidung offen
          </Badge>
        </div>
      </SectionCard>

      <div className="grid gap-4 2xl:grid-cols-2">
        {options.map((option) => (
          <PlanCard
            key={option.id}
            option={option}
            selected={selectedPlan === option.id}
            dimmed={selectedPlan !== option.id}
            onSelect={() => setSelectedPlan(option.id)}
          />
        ))}
      </div>
    </div>
  )
}

function PlanCard({
  option,
  selected,
  dimmed,
  onSelect,
}: {
  option: PlanOption
  selected: boolean
  dimmed: boolean
  onSelect: () => void
}) {
  const Icon = option.icon

  return (
    <section
      className={cn(
        "rounded-lg border bg-card p-4 transition-all",
        selected
          ? "border-primary shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary),transparent_75%)]"
          : "border-border",
        dimmed ? "opacity-45 grayscale-[35%]" : "opacity-100"
      )}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-md border bg-background">
            <Icon className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">{option.title}</h2>
              {selected ? (
                <Badge>
                  <CheckCircle2 />
                  Ausgewaehlt
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {option.subtitle}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium">
              <Clock3 className="size-4" />
              {option.impact}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant={selected ? "default" : "outline"}
          onClick={onSelect}
        >
          {selected ? "Massnahme aktiv" : "Diese Massnahme waehlen"}
        </Button>
      </div>

      <Swimlane steps={option.steps} />
    </section>
  )
}

function Swimlane({ steps }: { steps: LaneStep[] }) {
  return (
    <div className="overflow-x-auto rounded-md border bg-background">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[8rem_repeat(5,minmax(7.5rem,1fr))] border-b bg-muted/40 text-xs font-medium text-muted-foreground">
          <div className="px-3 py-2">Lane</div>
          {steps.map((step) => (
            <div key={step.id} className="px-3 py-2">
              {step.week}
            </div>
          ))}
        </div>

        {lanes.map((lane) => (
          <div
            key={lane}
            className="grid min-h-24 grid-cols-[8rem_repeat(5,minmax(7.5rem,1fr))] border-b last:border-b-0"
          >
            <div className="flex items-center border-r bg-muted/20 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {lane}
            </div>
            {steps.map((step, index) => {
              const inLane = step.lane === lane

              return (
                <div key={`${lane}-${step.id}`} className="relative p-2">
                  {inLane ? (
                    <div
                      className={cn(
                        "h-full rounded-md border p-3 text-sm shadow-sm",
                        toneClasses[step.tone]
                      )}
                    >
                      <p className="font-medium">{step.title}</p>
                      <p className="mt-1 text-xs opacity-75">{step.detail}</p>
                    </div>
                  ) : null}
                  {inLane && index < steps.length - 1 ? (
                    <ArrowRight className="absolute top-1/2 -right-2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
