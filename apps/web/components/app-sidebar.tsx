"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"

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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Bell, Eye, LayoutDashboard, Table2 } from "lucide-react"

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

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[var(--status-signal)] font-mono text-[11px] font-semibold tabular-nums text-background not-italic">
      {count > 9 ? "9+" : count}
    </span>
  )
}

export type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  projectId?: string
  aktivitaeten?: Aktivitaet[]
}

export function AppSidebar({ projectId, aktivitaeten = [], ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const tab = getShellTab(pathname)

  const workerNav = [
    { href: "/worker/overview", label: "Overview", icon: LayoutDashboard },
    { href: "/worker/lager", label: "Warehouse", icon: Table2 },
    { href: "/worker/observability", label: "Observability", icon: Eye },
  ] as const

  const badgeCount = aktivitaeten.length

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/worker" />}
            >
              <span className="text-base font-semibold">WBK</span>
              {projectId ? (
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {projectId.slice(0, 6)}
                </span>
              ) : null}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <Tabs
          value={tab}
          onValueChange={(next) => router.push(tabHref(next as ShellTab))}
        >
          <TabsList className="grid h-9 w-full grid-cols-3">
            <TabsTrigger value="planner" className="text-xs sm:text-sm" disabled>
              Planner
            </TabsTrigger>
            <TabsTrigger value="worker" className="text-xs sm:text-sm">
              Worker
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
      <SidebarContent>
        {tab === "worker" ? (
          <SidebarMenu className="px-2">
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
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8 text-center">
            <p className="font-sans text-sm text-muted-foreground not-italic">
              This view is currently disabled.
            </p>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2">
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="relative size-11 shrink-0 rounded-full touch-manipulation"
                  aria-label="Notifications"
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
              {projectId ? (
                <ActivityInboxPanel
                  projectId={projectId}
                  aktivitaeten={aktivitaeten}
                  maxHeightClassName="max-h-[min(26rem,calc(100svh-12rem))]"
                />
              ) : null}
            </PopoverContent>
          </Popover>

          <ThemeToggle className="size-11 rounded-full" menuSide="top" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
