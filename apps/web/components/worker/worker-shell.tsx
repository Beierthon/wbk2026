"use client"

import { usePathname } from "next/navigation"

import type { Aktivitaet, Bauprojekt } from "@workspace/domain"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { usePanelResize } from "@/hooks/use-panel-resize"
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { cn } from "@workspace/ui/lib/utils"

type ShellTab = "worker" | "planner" | "maintainer"

function getShellTab(pathname: string): ShellTab {
  if (pathname.startsWith("/planner")) return "planner"
  if (pathname.startsWith("/maintainer")) return "maintainer"
  return "worker"
}

function SidebarResizeHandle({
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  isDragging: boolean
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void
  onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void
}) {
  const { state } = useSidebar()

  if (state === "collapsed") {
    return null
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      className={cn(
        "fixed top-0 bottom-0 z-20 hidden w-2 -translate-x-1/2 cursor-col-resize md:block",
        isDragging ? "bg-muted/40" : "bg-transparent hover:bg-muted/20"
      )}
      style={{ left: "var(--sidebar-width)" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    />
  )
}

function WorkerShellLayout({
  projectId,
  aktivitaeten,
  projects,
  children,
  sidebarDragging,
  sidebarHandleProps,
}: {
  projectId: string
  aktivitaeten: Aktivitaet[]
  projects: Bauprojekt[]
  children: React.ReactNode
  sidebarDragging: boolean
  sidebarHandleProps: {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void
    onPointerEnd: (event: React.PointerEvent<HTMLDivElement>) => void
    onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void
  }
}) {
  const pathname = usePathname()
  const tab = getShellTab(pathname)
  const headerTitle =
    tab === "worker" ? "Worker" : tab === "planner" ? "Planner" : "Maintainer"

  return (
    <>
      <AppSidebar
        variant="inset"
        projectId={projectId}
        aktivitaeten={aktivitaeten}
        projects={projects}
      />

      <SidebarInset className="min-h-0 overflow-hidden">
        <SiteHeader title={headerTitle} />
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </SidebarInset>

      <SidebarResizeHandle
        isDragging={sidebarDragging}
        onPointerDown={sidebarHandleProps.onPointerDown}
        onPointerMove={sidebarHandleProps.onPointerMove}
        onPointerUp={sidebarHandleProps.onPointerEnd}
        onPointerCancel={sidebarHandleProps.onPointerCancel}
      />
    </>
  )
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
      <WorkerShellLayout
        projectId={projectId}
        aktivitaeten={aktivitaeten}
        projects={projects}
        sidebarDragging={sidebarDragging}
        sidebarHandleProps={sidebarHandleProps}
      >
        {children}
      </WorkerShellLayout>
    </SidebarProvider>
  )
}
