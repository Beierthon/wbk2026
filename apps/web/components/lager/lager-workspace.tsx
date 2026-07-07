"use client"

import { useState } from "react"
import { Package } from "lucide-react"

import { LagerBestandPanel } from "@/components/lager/lager-bestand-panel"
import { LagerKameraPanel } from "@/components/lager/lager-kamera-panel"
import type { Aktivitaet, LagerArtikel } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

const panelClass =
  "flex min-h-0 flex-col rounded-2xl border-2 border-sky-400/80 bg-sky-100 p-4 text-sky-950 shadow-sm"

interface LagerWorkspaceProps {
  projectId: string
  artikel: LagerArtikel[]
  aktivitaeten: Aktivitaet[]
}

export function LagerWorkspace({
  projectId,
  artikel,
  aktivitaeten,
}: LagerWorkspaceProps) {
  const isMobile = useIsMobile()
  const [lagerOpen, setLagerOpen] = useState(false)

  return (
    <div className="flex h-dvh flex-col gap-3 p-3 md:flex-row">
      <aside className={cn(panelClass, "hidden md:flex md:w-1/2 md:flex-col")}>
        <LagerBestandPanel artikel={artikel} className="flex-1" />
      </aside>

      <main className={cn(panelClass, "relative flex w-full flex-1 md:w-1/2")}>
        <LagerKameraPanel
          projectId={projectId}
          aktivitaeten={aktivitaeten}
          className="flex-1"
        />

        {isMobile ? (
          <>
            <Button
              type="button"
              size="icon-lg"
              className="fixed bottom-24 left-4 z-40 size-14 rounded-full border-2 border-amber-500 bg-amber-300 text-amber-950 shadow-lg hover:bg-amber-400"
              onClick={() => setLagerOpen(true)}
              aria-label="Lager Bestand öffnen"
            >
              <Package className="size-6" />
            </Button>

            <Sheet open={lagerOpen} onOpenChange={setLagerOpen}>
              <SheetContent side="bottom" className="max-h-[85dvh] bg-sky-50">
                <SheetHeader>
                  <SheetTitle>Lager Bestand</SheetTitle>
                </SheetHeader>
                <LagerBestandPanel artikel={artikel} className="mt-4" />
              </SheetContent>
            </Sheet>
          </>
        ) : null}
      </main>
    </div>
  )
}
