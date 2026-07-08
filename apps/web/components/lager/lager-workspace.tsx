"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Package } from "lucide-react"

import { LagerBestandPanel } from "@/components/lager/lager-bestand-panel"
import { LagerKameraPanel } from "@/components/lager/lager-kamera-panel"
import { ShellNotifications } from "@/components/shell-notifications"
import { ThemeToggle } from "@/components/theme-toggle"
import { countAttentionArtikel } from "@/lib/lager/status"
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

  const attentionCount = useMemo(
    () => countAttentionArtikel(artikel),
    [artikel]
  )

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 md:px-5">
        <Image
          src="/brand/wbk-mark.svg"
          alt="WBK"
          width={32}
          height={32}
          className="size-8 shrink-0 md:size-9"
          priority
        />

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

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 pt-0 md:flex-row md:gap-4 md:p-4 md:pt-0">
        <aside
          className={cn(
            "hidden min-h-0 rounded-xl border border-border bg-card p-4 md:flex md:w-[min(22rem,36%)] md:flex-col lg:w-[min(26rem,34%)]"
          )}
        >
          <LagerBestandPanel artikel={artikel} className="flex-1" />
        </aside>

        <main className="flex min-h-0 flex-1 flex-col">
          <LagerKameraPanel projectId={projectId} className="flex-1" />
        </main>
      </div>

      {isMobile ? (
        <>
          <Button
            type="button"
            size="icon-lg"
            className="fixed bottom-24 right-4 z-40 size-14 rounded-full shadow-lg"
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
