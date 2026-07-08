"use client"

import { AssetStatusBadge } from "@/components/dashboard/status-badges"
import { formatDisplayDate } from "@/components/dashboard/formatters"
import { CooperationThread } from "@/components/roles/cooperation-thread"
import type { BetriebUebersicht } from "@/lib/data/types"

export function MaintainerOverview({ data }: { data: BetriebUebersicht }) {
  const asset = data.assets[0]
  const wartung = data.wartungsaufgaben.find((item) => item.status !== "erledigt")
  const konfliktTitel =
    data.kostenprognosen[0]?.konfliktTitel ?? data.entscheidungen[0]?.titel

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Übernommene Assets und Wartung aus Bau- und Planungsentscheidungen.
        </p>

        {konfliktTitel ? (
          <CooperationThread
            currentRole="maintainer"
            konfliktTitel={konfliktTitel}
          />
        ) : null}

        {asset ? (
          <div className="rounded-md border border-border bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{asset.name}</p>
              <AssetStatusBadge status={asset.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {asset.standortBeschreibung}
            </p>
          </div>
        ) : null}

        {wartung ? (
          <div className="rounded-md border border-border bg-card px-4 py-3">
            <p className="text-sm font-medium">{wartung.titel}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
              Fällig {formatDisplayDate(wartung.faelligAm)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Keine offenen Wartungsaufgaben.
          </p>
        )}
      </div>
    </div>
  )
}
