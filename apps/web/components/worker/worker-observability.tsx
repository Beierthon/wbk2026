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
        "bg-geist-grid flex h-full min-h-0 flex-1 flex-col overflow-hidden",
        "pt-[max(0.5rem,env(safe-area-inset-top))]",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        "pl-[max(0.5rem,env(safe-area-inset-left))]",
        "pr-[max(0.5rem,env(safe-area-inset-right))]"
      )}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col p-2 sm:p-3 md:p-4 lg:p-5">
        <LagerKameraPanel
          projectId={projectId}
          artikel={artikel}
          className="min-h-0 flex-1"
          dockInset={false}
        />
      </div>
    </div>
  )
}

