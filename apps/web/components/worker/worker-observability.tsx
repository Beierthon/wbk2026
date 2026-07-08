"use client"

import { LagerKameraPanel } from "@/components/lager/lager-kamera-panel"
import type { LagerArtikel } from "@workspace/domain"
import { cn } from "@workspace/ui/lib/utils"

export function WorkerObservability({
  projectId,
  artikel,
}: {
  projectId: string
  artikel: LagerArtikel[]
}) {
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
      <div className="mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col gap-3 p-2 sm:gap-4 sm:p-3 md:p-4 lg:p-5">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex flex-col gap-0.5">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Worker
            </p>
            <h1 className="font-heading text-lg font-medium tracking-tight sm:text-xl">
              Kameraübersicht
            </h1>
          </div>
        </header>

        <LagerKameraPanel
          projectId={projectId}
          artikel={artikel}
          className="min-h-0 flex-1 p-0"
          variant="flush"
          streamLayout="grid"
          dockInset={false}
        />
      </div>
    </div>
  )
}
