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
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col md:min-h-[calc(100dvh-4rem)] md:flex-row md:gap-4">
      <aside className="hidden min-h-0 w-full border-r border-border pr-4 md:flex md:w-1/2 md:flex-col">
        <LagerBestandPanel artikel={artikel} className="flex-1" />
      </aside>

      <main className="relative flex min-h-0 w-full flex-1 flex-col md:w-1/2">
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
              className="fixed bottom-20 left-4 z-40 size-14 rounded-full shadow-lg"
              onClick={() => setLagerOpen(true)}
              aria-label="Lager Bestand öffnen"
            >
              <Package className="size-6" />
            </Button>

            <Sheet open={lagerOpen} onOpenChange={setLagerOpen}>
              <SheetContent side="bottom" className="max-h-[85dvh]">
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
