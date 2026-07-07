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
  "relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5 md:p-6"

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
    <div className="relative flex h-dvh flex-col gap-4 bg-muted/30 p-4 md:flex-row md:gap-5 md:p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[24px_24px]"
      />

      <aside className={cn(panelClass, "hidden md:flex md:w-1/2 md:flex-col")}>
        <LagerBestandPanel artikel={artikel} className="flex-1" />
      </aside>

      <main className={cn(panelClass, "flex w-full flex-1 md:w-1/2")}>
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
              className="fixed bottom-24 left-4 z-40 size-12 rounded-full shadow-lg"
              onClick={() => setLagerOpen(true)}
              aria-label="Lagerbestand öffnen"
            >
              <Package className="size-5" />
            </Button>

            <Sheet open={lagerOpen} onOpenChange={setLagerOpen}>
              <SheetContent
                side="bottom"
                className="max-h-[85dvh] rounded-t-2xl border-border bg-card"
              >
                <SheetHeader className="border-b border-border pb-4">
                  <SheetTitle className="text-left text-lg font-medium tracking-tight">
                    Lagerbestand
                  </SheetTitle>
                </SheetHeader>
                <LagerBestandPanel artikel={artikel} className="mt-4" hideHeader />
              </SheetContent>
            </Sheet>
          </>
        ) : null}
      </main>
    </div>
  )
}
