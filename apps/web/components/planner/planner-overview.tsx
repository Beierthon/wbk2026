"use client"

import { ConflictStatusBadge } from "@/components/dashboard/status-badges"
import { CooperationThread } from "@/components/roles/cooperation-thread"
import type { PlanungsUebersicht } from "@/lib/data/types"

export function PlannerOverview({ data }: { data: PlanungsUebersicht }) {
  const konflikt = data.konflikte.find(
    (item) => item.status !== "geloest" && item.status !== "uebernommen"
  )
  const plan = data.planstaende[0]?.aktuelleVersion

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Meldungen von der Baustelle prüfen, Plan anpassen, Entscheidung für den
          Betrieb festhalten.
        </p>

        {konflikt ? (
          <CooperationThread
            currentRole="planner"
            konfliktTitel={konflikt.titel}
          />
        ) : null}

        {konflikt ? (
          <div className="rounded-md border border-border bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{konflikt.titel}</p>
              <ConflictStatusBadge status={konflikt.status} />
            </div>
            {plan ? (
              <p className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
                Plan {plan.version}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Keine offenen Konflikte.</p>
        )}
      </div>
    </div>
  )
}
