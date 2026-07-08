"use client"

import { useEffect, useMemo, useState } from "react"

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
  "transition-all duration-200 ease-out motion-reduce:transition-none"

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
  const [dockExpanded, setDockExpanded] = useState<LagerDockExpanded>("none")
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)")
    const sync = () => setIsDesktop(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    if (isDesktop && dockExpanded === "inventory") {
      setDockExpanded("none")
    }
  }, [dockExpanded, isDesktop])

  const attentionCount = useMemo(
    () => countAttentionArtikel(artikel),
    [artikel]
  )

  const inventoryActive = isDesktop
    ? showInventoryDesktop
    : dockExpanded === "inventory"

  return (
    <div
      className={cn(
        "bg-geist-grid relative flex h-dvh min-h-0 flex-col overflow-hidden font-sans not-italic antialiased",
        "pt-[max(0.5rem,env(safe-area-inset-top))]",
        "pb-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom)))]",
        "pl-[max(0.5rem,env(safe-area-inset-left))]",
        "pr-[max(0.5rem,env(safe-area-inset-right))]"
      )}
    >
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col p-2 sm:p-3 md:p-4 lg:p-5">
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border sm:rounded-2xl",
            "bg-card shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col md:min-h-[24rem] md:flex-row lg:min-h-[28rem]">
            <section
              className={cn(
                "hidden min-h-0 min-w-0 flex-col overflow-hidden border-border md:flex md:border-r",
                panelMotion,
                showInventoryDesktop
                  ? "md:w-[min(18rem,42%)] md:opacity-100 lg:w-[min(24rem,36%)] xl:w-[min(26rem,34%)]"
                  : "md:w-0 md:border-r-0 md:opacity-0"
              )}
            >
              <LagerBestandPanel
                artikel={artikel}
                className="flex-1 p-4 lg:p-5"
              />
            </section>

            <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <LagerKameraPanel
                projectId={projectId}
                className="min-h-0 flex-1"
                dockInset
              />
            </section>
          </div>
        </div>
      </div>

      <LagerFloatingDock
        projectId={projectId}
        aktivitaeten={aktivitaeten}
        artikel={artikel}
        isDesktop={isDesktop}
        inventoryActive={inventoryActive}
        attentionCount={attentionCount}
        expanded={dockExpanded}
        onDesktopInventoryToggle={() =>
          setShowInventoryDesktop((current) => !current)
        }
        onExpandedChange={setDockExpanded}
      />
    </div>
  )
}
