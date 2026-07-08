"use client"

import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"
import { ArrowRight } from "lucide-react"

type CooperationRole = "worker" | "planner" | "maintainer"

const roleMeta: Record<
  CooperationRole,
  { label: string; href: string; task: string }
> = {
  worker: {
    label: "Worker",
    href: "/worker/overview",
    task: "Meldet Konflikte und Fotos von der Baustelle",
  },
  planner: {
    label: "Planner",
    href: "/planner/overview",
    task: "Prüft Planstand, dokumentiert Entscheidung",
  },
  maintainer: {
    label: "Maintainer",
    href: "/maintainer/overview",
    task: "Übernimmt Assets und Wartung in den Betrieb",
  },
}

export function CooperationThread({
  currentRole,
  konfliktTitel,
  planVersion,
  entscheidungTitel,
  assetName,
}: {
  currentRole: CooperationRole
  konfliktTitel: string
  planVersion?: string
  entscheidungTitel?: string
  assetName?: string
}) {
  const sharedFacts = [
    { label: "Konflikt", value: konfliktTitel },
    planVersion ? { label: "Plan", value: planVersion } : null,
    entscheidungTitel ? { label: "Entscheidung", value: entscheidungTitel } : null,
    assetName ? { label: "Asset", value: assetName } : null,
  ].filter((item): item is { label: string; value: string } => item !== null)

  const steps: Array<{ role: CooperationRole; detail: string }> = [
    { role: "worker", detail: "Bodenabweichung im Südfeld gemeldet" },
    {
      role: "planner",
      detail: planVersion
        ? `Plan ${planVersion} als Addendum vorbereitet`
        : "Plananpassung in Prüfung",
    },
    {
      role: "maintainer",
      detail: assetName
        ? `${assetName} mit Wartungsintervall übernommen`
        : "Betriebsfolgen aus Entscheidung ableiten",
    },
  ]

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-[0_2px_2px_rgba(0,0,0,0.04)] sm:p-5">
      <div className="flex flex-col gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Gemeinsamer Kontext
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Alle Rollen sehen dieselbe Konfliktlinie — jede Phase ergänzt den
            nächsten Schritt.
          </p>
        </div>

        <dl className="grid gap-2 sm:grid-cols-2">
          {sharedFacts.map((fact) => (
            <div
              key={fact.label}
              className="rounded-md border border-border bg-muted/20 px-3 py-2"
            >
              <dt className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                {fact.label}
              </dt>
              <dd className="mt-0.5 truncate text-sm font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <ol className="flex flex-col gap-2 md:flex-row md:items-stretch">
          {steps.map((step, index) => {
            const meta = roleMeta[step.role]
            const isActive = step.role === currentRole

            return (
              <li key={step.role} className="flex min-w-0 flex-1 items-stretch gap-2">
                <Link
                  href={meta.href}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col rounded-md border px-3 py-3 transition-colors",
                    isActive
                      ? "border-[var(--status-signal)] bg-[var(--status-signal)]/5"
                      : "border-border bg-background hover:bg-muted/30"
                  )}
                >
                  <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                    {meta.label}
                    {isActive ? " · Du bist hier" : ""}
                  </span>
                  <span className="mt-1 text-sm font-medium">{step.detail}</span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {meta.task}
                  </span>
                </Link>
                {index < steps.length - 1 ? (
                  <ArrowRight
                    aria-hidden
                    className="mx-auto hidden size-4 shrink-0 self-center text-muted-foreground md:block"
                  />
                ) : null}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
