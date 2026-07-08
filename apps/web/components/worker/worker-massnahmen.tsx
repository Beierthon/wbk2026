"use client"

import { ProjektzeitplanOptions } from "@/components/planung/projektzeitplan-options"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export function WorkerMassnahmen() {
  return (
    <div
      className={cn(
        "bg-background flex h-full min-h-0 flex-1 flex-col overflow-hidden",
        "pt-[max(0.5rem,env(safe-area-inset-top))]",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        "pl-[max(0.5rem,env(safe-area-inset-left))]",
        "pr-[max(0.5rem,env(safe-area-inset-right))]"
      )}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col gap-4 overflow-y-auto p-2 sm:gap-6 sm:p-3 md:p-4 lg:p-5">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-1">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Worker
            </p>
            <h1 className="font-heading text-lg font-medium tracking-tight sm:text-xl">
              Maßnahmen
            </h1>
            <p className="text-sm text-muted-foreground">
              Maßnahmen für Materialengpässe vergleichen und auswählen.
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            Engpass: Besucherstühle
          </Badge>
        </header>

        <ProjektzeitplanOptions />
      </div>
    </div>
  )
}
