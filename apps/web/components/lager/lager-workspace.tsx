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

const chromeButtonClass =
  "size-11 touch-manipulation rounded-full border border-border/40 bg-card/70 shadow-sm backdrop-blur-md hover:bg-card/90"

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
    <div className="relative flex h-dvh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-100/90 via-teal-50/80 to-sky-100 dark:from-emerald-950/50 dark:via-background dark:to-sky-950/40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(16,185,129,0.18),transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(14,165,233,0.16),transparent_45%)] dark:opacity-60"
      />

      <aside className="relative z-10 flex w-[3.75rem] shrink-0 flex-col items-center gap-3 py-4 md:w-16 lg:w-[4.5rem] lg:py-5">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-border/40 bg-card/70 shadow-sm backdrop-blur-md">
          <Image
            src="/brand/wbk-mark.svg"
            alt="WBK"
            width={28}
            height={28}
            className="size-7"
            priority
          />
        </div>

        {isMobile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className={cn(chromeButtonClass, "relative")}
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
        ) : null}
      </aside>

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col p-3 pb-4 md:p-4 md:pb-5 lg:p-5">
        <div className="mb-3 flex shrink-0 items-center justify-end gap-1.5 md:mb-4">
          <ThemeToggle className={chromeButtonClass} />
          <ShellNotifications
            projectId={projectId}
            aktivitaeten={aktivitaeten}
            hideLogLink
            iconOnly
            triggerClassName={chromeButtonClass}
          />
        </div>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-border/50",
            "bg-card/95 shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-sm",
            "md:rounded-[2rem] lg:rounded-[2.25rem]"
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <section className="hidden min-h-0 border-border/60 md:flex md:w-[min(22rem,38%)] md:flex-col md:border-r lg:w-[min(26rem,36%)]">
              <LagerBestandPanel artikel={artikel} className="flex-1 p-5" />
            </section>

            <section className="flex min-h-0 flex-1 flex-col">
              <LagerKameraPanel projectId={projectId} className="flex-1" />
            </section>
          </div>
        </div>
      </div>

      {isMobile ? (
        <Sheet open={lagerOpen} onOpenChange={setLagerOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[85dvh] rounded-t-[1.75rem] border-border bg-card"
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
      ) : null}
    </div>
  )
}
