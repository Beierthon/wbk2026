"use client"

import { usePathname } from "next/navigation"
import { usePanelResize } from "@/hooks/use-panel-resize"

import type { Aktivitaet, Bauprojekt } from "@workspace/domain"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"
import { cn } from "@workspace/ui/lib/utils"

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null

  return (
    <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[var(--status-signal)] font-mono text-[11px] font-semibold tabular-nums text-background not-italic">
      {count > 9 ? "9+" : count}
    </span>
  )
}

type ShellTab = "worker" | "planner" | "maintainer"

function getShellTab(pathname: string): ShellTab {
  if (pathname.startsWith("/planner")) return "planner"
  if (pathname.startsWith("/maintainer")) return "maintainer"
  return "worker"
}

function tabHref(tab: ShellTab) {
  if (tab === "planner") return "/planner"
  if (tab === "maintainer") return "/maintainer"
  return "/worker"
}

export function WorkerShell({
  projectId,
  aktivitaeten,
  projects,
  children,
}: {
  projectId: string
  aktivitaeten: Aktivitaet[]
  projects: Bauprojekt[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const tab = getShellTab(pathname)

  const {
    size: sidebarWidth,
    isDragging: sidebarDragging,
    handleProps: sidebarHandleProps,
  } = usePanelResize({
    axis: "x",
    initial: 300,
    min: 220,
    max: 520,
    storageKey: "wbk-worker-sidebar-width",
  })

  const headerTitle =
    tab === "worker" ? "Worker" : tab === "planner" ? "Planner" : "Maintainer"

  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
          "--header-height": "calc(var(--spacing) * 12)",
        } as unknown as Record<string, string>
      }
    >
      <div className="group/sidebar-wrapper flex min-h-svh w-full">
        <AppSidebar
          variant="inset"
          projectId={projectId}
          aktivitaeten={aktivitaeten}
          projects={projects}
        />

        {/* Resize handle (desktop) */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          className={cn(
            "relative hidden md:block w-2 cursor-col-resize",
            sidebarDragging ? "bg-muted/40" : "bg-transparent hover:bg-muted/20"
          )}
          onPointerDown={sidebarHandleProps.onPointerDown}
          onPointerMove={sidebarHandleProps.onPointerMove}
          onPointerUp={sidebarHandleProps.onPointerEnd}
          onPointerCancel={sidebarHandleProps.onPointerCancel}
        />

        <SidebarInset className="min-h-0">
          <SiteHeader title={headerTitle} />

          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

