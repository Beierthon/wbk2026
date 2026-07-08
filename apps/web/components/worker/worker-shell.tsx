"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Eye, LayoutDashboard, Table2 } from "lucide-react"

import { ActivityInboxPanel } from "@/components/notifications/activity-inbox-panel"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Aktivitaet } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
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
  children,
}: {
  projectId: string
  aktivitaeten: Aktivitaet[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const tab = getShellTab(pathname)

  // notifications count (avoid hydration mismatch by using activities length as fallback)
  const badgeCount = aktivitaeten.length

  const workerNav = [
    { href: "/worker/overview", label: "Übersicht", icon: LayoutDashboard },
    { href: "/worker/lager", label: "Lager", icon: Table2 },
    { href: "/worker/observability", label: "Observability", icon: Eye },
  ] as const

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="offcanvas" variant="sidebar">
        <SidebarHeader className="gap-2 pb-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={<Link href="/worker" />}
                className="data-[slot=sidebar-menu-button]:p-1.5!"
              >
                <Image
                  src="/brand/wbk-mark.svg"
                  alt="WBK"
                  width={28}
                  height={28}
                  className="size-7"
                />
                <div className="flex min-w-0 flex-col gap-0.5 leading-none">
                  <span className="truncate text-sm font-semibold">WBK</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Projekt {projectId.slice(0, 6)}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <Tabs
            value={tab}
            onValueChange={(next) => router.push(tabHref(next as ShellTab))}
          >
            <TabsList className="grid h-9 w-full grid-cols-3">
              <TabsTrigger value="worker" className="text-xs sm:text-sm">
                Worker
              </TabsTrigger>
              <TabsTrigger value="planner" className="text-xs sm:text-sm" disabled>
                Planner
              </TabsTrigger>
              <TabsTrigger
                value="maintainer"
                className="text-xs sm:text-sm"
                disabled
              >
                Maintainer
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </SidebarHeader>

        <SidebarSeparator className="mx-0" />

        <SidebarContent>
          {tab === "worker" ? (
            <div className="p-2">
              <SidebarMenu>
                {workerNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={
                        item.href === "/worker/overview"
                          ? pathname === "/worker" || pathname === "/worker/overview"
                          : pathname.startsWith(item.href)
                      }
                      render={<Link href={item.href} prefetch />}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8 text-center">
              <p className="font-sans text-sm text-muted-foreground not-italic">
                Diese Ansicht ist aktuell deaktiviert.
              </p>
            </div>
          )}
        </SidebarContent>

        <SidebarFooter className="gap-2 border-t border-sidebar-border">
          <div className="flex items-center justify-between gap-2">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className="relative size-11 shrink-0 rounded-full touch-manipulation"
                    aria-label="Benachrichtigungen"
                  />
                }
              >
                <Bell className="size-5" />
                <CountBadge count={badgeCount} />
              </PopoverTrigger>
              <PopoverContent
                align="end"
                side="top"
                className="flex w-[min(360px,calc(100vw-1.5rem))] flex-col gap-0 overflow-hidden p-0"
              >
                <ActivityInboxPanel
                  projectId={projectId}
                  aktivitaeten={aktivitaeten}
                  maxHeightClassName="max-h-[min(26rem,calc(100svh-12rem))]"
                />
              </PopoverContent>
            </Popover>

            <ThemeToggle className="size-11 rounded-full" menuSide="top" />
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-h-0">
        {/* Mobile-friendly top bar with a simple “show sidebar” button */}
        <header
          className={cn(
            "flex h-12 shrink-0 items-center gap-2 border-b px-3",
            "md:hidden"
          )}
        >
          <SidebarTrigger className="-ml-1" />
          <p className="truncate font-sans text-sm font-medium not-italic">
            {tab === "worker" ? "Worker" : tab === "planner" ? "Planner" : "Maintainer"}
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

