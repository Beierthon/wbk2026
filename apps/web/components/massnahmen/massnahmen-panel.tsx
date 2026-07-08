"use client"

import Link from "next/link"
import { Check, ClipboardList, ExternalLink, EyeOff, RotateCcw } from "lucide-react"

import { formatRelativeTime } from "@/components/dashboard/formatters"
import { useMassnahmen } from "@/hooks/use-massnahmen"
import {
  prioritaetBadgeVariant,
  prioritaetLabel,
  statusLabel,
  type MassnahmeViewModel,
} from "@/lib/massnahmen/massnahmen-helpers"
import type { Aktivitaet } from "@workspace/domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

function MassnahmeCard({
  item,
  onDone,
  onDismiss,
  onRestore,
}: {
  item: MassnahmeViewModel
  onDone: (id: string) => void
  onDismiss: (id: string) => void
  onRestore: (id: string) => void
}) {
  const { aktivitaet, payload, status, lagerArtikelId } = item
  const isOpen = status === "offen"

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        status === "erledigt" && "opacity-80",
        status === "ausgeblendet" && "opacity-70"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={prioritaetBadgeVariant(payload.prioritaet)}>
              {prioritaetLabel(payload.prioritaet)}
            </Badge>
            <Badge variant="outline">{statusLabel(status)}</Badge>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {formatRelativeTime(aktivitaet.createdAt)}
            </span>
          </div>
          <h3 className="font-sans text-sm font-medium not-italic">
            {payload.empfohleneAktion}
          </h3>
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            Bestand {payload.aktuell} / {payload.maximal} · Ziel {payload.zielBestand}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1">
          {lagerArtikelId ? (
            <Button
              render={<Link href={`/worker/lager?artikel=${lagerArtikelId}`} />}
              variant="outline"
              size="sm"
              className="h-8"
            >
              <ExternalLink className="size-3.5" />
              Artikel
            </Button>
          ) : null}
          {isOpen ? (
            <>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-8"
                onClick={() => onDone(aktivitaet.id)}
              >
                <Check className="size-3.5" />
                Erledigt
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground"
                onClick={() => onDismiss(aktivitaet.id)}
              >
                <EyeOff className="size-3.5" />
                Ausblenden
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => onRestore(aktivitaet.id)}
            >
              <RotateCcw className="size-3.5" />
              Wieder öffnen
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

function MassnahmenEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <ClipboardList className="size-8 text-muted-foreground/50" aria-hidden />
      <p className="max-w-sm font-sans text-sm text-muted-foreground not-italic">
        {message}
      </p>
    </div>
  )
}

export function MassnahmenPanel({
  projectId,
  aktivitaeten,
  className,
}: {
  projectId: string
  aktivitaeten: Aktivitaet[]
  className?: string
}) {
  const {
    hydrated,
    items,
    openItems,
    openCount,
    markErledigt,
    ausblenden,
    wiederOeffnen,
  } = useMassnahmen({ projectId, aktivitaeten })

  const doneItems = items.filter((item) => item.status === "erledigt")
  const dismissedItems = items.filter((item) => item.status === "ausgeblendet")

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden bg-background",
        className
      )}
    >
      <header className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Empfohlene Handlungen
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-sans text-lg font-medium tracking-tight not-italic">
              Maßnahmen
            </h1>
            <p className="mt-1 font-sans text-sm text-muted-foreground not-italic">
              Automatisch vorgeschlagen bei leerem Bestand oder Abweichung vom
              Soll.
            </p>
          </div>
          {hydrated ? (
            <Badge variant="secondary" className="font-mono tabular-nums">
              {openCount} offen
            </Badge>
          ) : null}
        </div>
      </header>

      <Tabs defaultValue="offen" className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="shrink-0 border-b border-border px-4 py-3 sm:px-6">
          <TabsList className="grid h-9 w-full max-w-md grid-cols-3">
            <TabsTrigger value="offen">
              Offen
              {openCount > 0 ? (
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {openCount}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="erledigt">Erledigt</TabsTrigger>
            <TabsTrigger value="ausgeblendet">Ausgeblendet</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="offen"
          className="mt-0 min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
        >
          {openItems.length === 0 ? (
            <MassnahmenEmptyState message="Keine offenen Maßnahmen. Bei Bestandsproblemen erscheinen hier Vorschläge automatisch." />
          ) : (
            <div className="flex flex-col gap-3">
              {openItems.map((item) => (
                <MassnahmeCard
                  key={item.aktivitaet.id}
                  item={item}
                  onDone={markErledigt}
                  onDismiss={ausblenden}
                  onRestore={wiederOeffnen}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="erledigt"
          className="mt-0 min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
        >
          {doneItems.length === 0 ? (
            <MassnahmenEmptyState message="Noch keine erledigten Maßnahmen." />
          ) : (
            <div className="flex flex-col gap-3">
              {doneItems.map((item) => (
                <MassnahmeCard
                  key={item.aktivitaet.id}
                  item={item}
                  onDone={markErledigt}
                  onDismiss={ausblenden}
                  onRestore={wiederOeffnen}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="ausgeblendet"
          className="mt-0 min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
        >
          {dismissedItems.length === 0 ? (
            <MassnahmenEmptyState message="Keine ausgeblendeten Maßnahmen." />
          ) : (
            <div className="flex flex-col gap-3">
              {dismissedItems.map((item) => (
                <MassnahmeCard
                  key={item.aktivitaet.id}
                  item={item}
                  onDone={markErledigt}
                  onDismiss={ausblenden}
                  onRestore={wiederOeffnen}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
