"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"

import {
  LagerFloatingDock,
  type LagerDockExpanded,
} from "@/components/lager/lager-floating-dock"
import { LagerBestandPanel } from "@/components/lager/lager-bestand-panel"
import { LagerKameraPanel } from "@/components/lager/lager-kamera-panel"
import { countAttentionArtikel } from "@/lib/lager/status"
import type { Aktivitaet, LagerArtikel } from "@workspace/domain"
import { cn } from "@workspace/ui/lib/utils"

const panelMotion =
  "transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.1)] motion-reduce:transition-none"

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
  const [showInventoryDesktop, setShowInventoryDesktop] = useState(true)
  const [mobileView, setMobileView] = useState<"camera" | "inventory">("camera")
  const [dockExpanded, setDockExpanded] = useState<LagerDockExpanded>("none")
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)")
    const sync = () => setIsDesktop(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  const attentionCount = useMemo(
    () => countAttentionArtikel(artikel),
    [artikel]
  )

  const inventoryActive = isDesktop
    ? showInventoryDesktop
    : mobileView === "inventory"

  function handleInventoryToggle() {
    if (isDesktop) {
      setShowInventoryDesktop((current) => !current)
      return
    }
    setMobileView((current) => (current === "camera" ? "inventory" : "camera"))
  }

  return (
    <div
      className={cn(
        "relative flex h-dvh min-h-0 flex-col overflow-hidden",
        "pt-[max(0.5rem,env(safe-area-inset-top))]",
        "pb-[max(6.5rem,calc(5.5rem+env(safe-area-inset-bottom)))]",
        "pl-[max(0.5rem,env(safe-area-inset-left))]",
        "pr-[max(0.5rem,env(safe-area-inset-right))]"
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

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col p-2 sm:p-3 md:p-4 lg:p-5">
        <div
          className={cn(
            "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/50 sm:rounded-[1.75rem]",
            "bg-card/95 shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-sm",
            "md:rounded-[2rem] lg:rounded-[2.25rem]"
          )}
        >
          <div className="absolute top-3 left-3 z-20 flex size-9 items-center justify-center rounded-xl border border-border/40 bg-background/70 shadow-sm backdrop-blur-md sm:top-4 sm:left-4 sm:size-10 sm:rounded-2xl">
            <Image
              src="/brand/wbk-mark.svg"
              alt="WBK"
              width={24}
              height={24}
              className="size-5 sm:size-6"
              priority
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col md:min-h-[24rem] md:flex-row lg:min-h-[28rem]">
            <section
              className={cn(
                "hidden min-h-0 min-w-0 flex-col overflow-hidden border-border/60 md:flex md:border-r",
                panelMotion,
                showInventoryDesktop
                  ? "md:w-[min(18rem,42%)] md:opacity-100 lg:w-[min(24rem,36%)] xl:w-[min(26rem,34%)]"
                  : "md:w-0 md:border-r-0 md:opacity-0"
              )}
            >
              <LagerBestandPanel
                artikel={artikel}
                className="flex-1 p-4 pt-14 lg:p-5 lg:pt-16"
              />
            </section>

            <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <div
                className={cn(
                  "absolute inset-0 flex min-h-0 flex-col md:relative md:flex-1",
                  panelMotion,
                  mobileView === "camera"
                    ? "z-10 translate-x-0 opacity-100"
                    : "pointer-events-none z-0 translate-x-3 opacity-0 md:pointer-events-auto md:translate-x-0 md:opacity-100"
                )}
              >
                <LagerKameraPanel
                  projectId={projectId}
                  className="min-h-0 flex-1"
                  dockInset
                />
              </div>

              <div
                className={cn(
                  "absolute inset-0 flex min-h-0 flex-col md:hidden",
                  panelMotion,
                  mobileView === "inventory"
                    ? "z-10 translate-x-0 opacity-100"
                    : "pointer-events-none z-0 -translate-x-3 opacity-0"
                )}
              >
                <LagerBestandPanel
                  artikel={artikel}
                  className="min-h-0 flex-1 overflow-hidden p-4 pt-14"
                  hideHeader
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      <LagerFloatingDock
        projectId={projectId}
        aktivitaeten={aktivitaeten}
        inventoryActive={inventoryActive}
        attentionCount={attentionCount}
        expanded={dockExpanded}
        onInventoryToggle={handleInventoryToggle}
        onExpandedChange={setDockExpanded}
      />
    </div>
  )
}
