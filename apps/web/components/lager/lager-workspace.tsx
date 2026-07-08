"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Package } from "lucide-react"

import { LagerBestandPanel } from "@/components/lager/lager-bestand-panel"
import { LagerKameraPanel } from "@/components/lager/lager-kamera-panel"
import { ShellNotifications } from "@/components/shell-notifications"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Aktivitaet, LagerArtikel } from "@workspace/domain"
import { Badge } from "@workspace/ui/components/badge"
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
  "relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.04)]"

interface LagerWorkspaceProps {
  projectId: string
  artikel: LagerArtikel[]
  aktivitaeten: Aktivitaet[]
}

function artikelNeedsAttention(artikel: LagerArtikel) {
  return artikel.aktuell <= artikel.mindestbestand
}

export function LagerWorkspace({
  projectId,
  artikel,
  aktivitaeten,
}: LagerWorkspaceProps) {
  const isMobile = useIsMobile()
  const [lagerOpen, setLagerOpen] = useState(false)

  const attentionCount = useMemo(
    () => artikel.filter(artikelNeedsAttention).length,
    [artikel]
  )

  return (
    <div className="relative flex h-dvh flex-col bg-muted/30">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[24px_24px]"
      />

      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 py-3 md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/brand/wbk-mark.svg"
            alt="WBK"
            width={32}
            height={32}
            className="size-8 shrink-0 md:size-9"
            priority
          />
          <div className="min-w-0 md:hidden">
            <p className="truncate text-sm font-medium tracking-tight">Lager</p>
            <p className="truncate text-xs text-muted-foreground">
              Kamera & Bestand
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <ShellNotifications
            projectId={projectId}
            aktivitaeten={aktivitaeten}
            hideLogLink
            iconOnly
          />
        </div>
      </header>

      <div className="relative z-0 flex min-h-0 flex-1 flex-col gap-3 p-3 pt-0 md:flex-row md:gap-4 md:p-4 md:pt-0">
        <aside
          className={cn(
            panelClass,
            "hidden min-h-0 md:flex md:w-[min(24rem,38%)] md:flex-col md:p-5 lg:w-[min(28rem,36%)]"
          )}
        >
          <LagerBestandPanel artikel={artikel} className="flex-1" />
        </aside>

        <main className={cn(panelClass, "flex min-h-0 flex-1 flex-col")}>
          <LagerKameraPanel projectId={projectId} className="flex-1" />
        </main>
      </div>

      {isMobile ? (
        <>
          <Button
            type="button"
            size="icon-lg"
            className="fixed bottom-6 right-4 z-40 size-14 rounded-full shadow-lg"
            onClick={() => setLagerOpen(true)}
            aria-label="Lagerbestand öffnen"
          >
            <Package className="size-5" />
            {attentionCount > 0 ? (
              <Badge className="absolute -top-1 -right-1 size-5 justify-center rounded-full p-0 text-[10px]">
                {attentionCount}
              </Badge>
            ) : null}
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
              <LagerBestandPanel
                artikel={artikel}
                className="mt-4 px-1"
                hideHeader
              />
            </SheetContent>
          </Sheet>
        </>
      ) : null}
    </div>
  )
}
