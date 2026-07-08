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
  const [lagerOpen, setLagerOpen] = useState(false)

  const attentionCount = useMemo(
    () => countAttentionArtikel(artikel),
    [artikel]
  )

  return (
    <div
      className={cn(
        "relative flex h-dvh min-h-0 overflow-hidden",
        "pt-[max(0.5rem,env(safe-area-inset-top))]",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        "pl-[max(0px,env(safe-area-inset-left))]",
        "pr-[max(0px,env(safe-area-inset-right))]"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-100/90 via-teal-50/80 to-sky-100 dark:from-emerald-950/50 dark:via-background dark:to-sky-950/40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(16,185,129,0.18),transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(14,165,233,0.16),transparent_45%)] dark:opacity-60"
      />

      <aside className="relative z-10 flex w-14 shrink-0 flex-col items-center gap-2 py-3 sm:w-16 sm:gap-3 sm:py-4 lg:w-[4.5rem]">
        <div className="flex size-10 items-center justify-center rounded-2xl border border-border/40 bg-card/70 shadow-sm backdrop-blur-md sm:size-11">
          <Image
            src="/brand/wbk-mark.svg"
            alt="WBK"
            width={28}
            height={28}
            className="size-6 sm:size-7"
            priority
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className={cn(chromeButtonClass, "relative md:hidden")}
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
      </aside>

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col p-2 sm:p-3 md:p-4 lg:mx-auto lg:max-w-[90rem] lg:p-5">
        <div className="mb-2 flex shrink-0 items-center justify-end gap-1.5 sm:mb-3 md:mb-4">
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
            "flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/50 sm:rounded-[1.75rem]",
            "bg-card/95 shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-sm",
            "md:rounded-[2rem] lg:rounded-[2.25rem]"
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col md:min-h-[24rem] md:flex-row lg:min-h-[28rem]">
            <section className="hidden min-h-0 min-w-0 border-border/60 md:flex md:w-[min(18rem,42%)] md:flex-col md:border-r lg:w-[min(24rem,36%)] xl:w-[min(26rem,34%)]">
              <LagerBestandPanel
                artikel={artikel}
                className="flex-1 p-4 lg:p-5"
              />
            </section>

            <section className="flex min-h-0 min-w-0 flex-1 flex-col">
              <LagerKameraPanel projectId={projectId} className="min-h-0 flex-1" />
            </section>
          </div>
        </div>
      </div>

      <Sheet open={lagerOpen} onOpenChange={setLagerOpen}>
        <SheetContent
          side="bottom"
          className={cn(
            "flex max-h-[min(85dvh,32rem)] flex-col rounded-t-2xl border-border bg-card sm:max-h-[min(80dvh,36rem)] sm:rounded-t-[1.75rem]",
            "pb-[max(1rem,env(safe-area-inset-bottom))]"
          )}
        >
          <SheetHeader className="shrink-0 border-b border-border pb-4">
            <SheetTitle className="text-left text-lg font-medium tracking-tight">
              Lagerbestand
            </SheetTitle>
          </SheetHeader>
          <LagerBestandPanel
            artikel={artikel}
            className="mt-4 min-h-0 flex-1 overflow-hidden px-1"
            hideHeader
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
