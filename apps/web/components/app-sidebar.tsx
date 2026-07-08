"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { ActivityInboxPanel } from "@/components/notifications/activity-inbox-panel"
import { TeamSwitcher } from "@/components/team-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useActivityInbox } from "@/hooks/use-activity-inbox"
import { switchProjectAction } from "@/lib/actions/project-session-actions"
import type { Aktivitaet } from "@workspace/domain"
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
  SidebarRail,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { cn } from "@workspace/ui/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Bell, Eye, LayoutDashboard, Table2 } from "lucide-react"

type ShellTab = "planner" | "worker" | "maintainer"

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
    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--status-signal)] font-mono text-[10px] font-semibold tabular-nums text-background not-italic group-data-[collapsible=icon]:-top-1 group-data-[collapsible=icon]:-right-1 group-data-[collapsible=icon]:size-3.5 group-data-[collapsible=icon]:text-[9px]">
      {count > 9 ? "9+" : count}
    </span>
  )
}

export type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  projectId: string
  aktivitaeten: Aktivitaet[]
  projects: Array<{ id: string; name: string }>
}

export function AppSidebar({
  projectId,
  aktivitaeten,
  projects,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const tab = getShellTab(pathname)
  const { hydrated, inboxCount } = useActivityInbox({ projectId, aktivitaeten })
  const badgeCount = hydrated ? inboxCount : aktivitaeten.length
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const workerNav = [
    { href: "/worker/overview", label: "Overview", icon: LayoutDashboard },
    { href: "/worker/lager", label: "ERP-Bestand", icon: Table2 },
    { href: "/worker/observability", label: "Observability", icon: Eye },
  ] as const

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="overflow-hidden">
        <TeamSwitcher
          label="Projects"
          addLabel="Add project"
          activeTeamId={projectId}
          onActiveTeamChange={(nextId) => {
            void switchProjectAction(nextId)
            router.refresh()
          }}
          teams={projects.map((p) => ({
            id: p.id,
            name: p.name,
            logo: (
              <Image
                src="/thirdeye-logo.png"
                alt=""
                width={20}
                height={20}
                className="size-5 shrink-0 rounded-sm object-contain"
              />
            ),
            plan: p.id === projectId ? "Active" : "Project",
          }))}
        />

        <div className="group-data-[collapsible=icon]:hidden">
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
        </div>
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
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8 text-center group-data-[collapsible=icon]:hidden">
            <p className="font-sans text-sm text-muted-foreground not-italic">
              This view is currently disabled.
            </p>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="overflow-hidden">
        <SidebarMenu
          className={cn(
            "transition-[gap] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
            isCollapsed
              ? "flex-col items-center gap-2"
              : "flex-row items-center gap-2"
          )}
        >
          <SidebarMenuItem
            className={cn(!isCollapsed && "min-w-0 flex-1")}
          >
            <Popover>
              <PopoverTrigger
                render={
                  <SidebarMenuButton
                    tooltip="Benachrichtigungen"
                    className="relative"
                  />
                }
              >
                <Bell />
                <span>Benachrichtigungen</span>
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
          </SidebarMenuItem>
          <SidebarMenuItem
            className={cn(!isCollapsed && "min-w-0 flex-1")}
          >
            <ThemeToggle variant="sidebar" menuSide="top" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
