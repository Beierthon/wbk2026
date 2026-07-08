"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Building2,
  Calculator,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  HardHat,
  History,
  LayoutDashboard,
  MapPin,
  Plug,
  Ruler,
  ScanLine,
  ShieldAlert,
  Smartphone,
} from "lucide-react"

import { GlobalSearch } from "@/components/global-search"
import { ProjectRealtimeSync } from "@/components/project-realtime-sync"
import { ProjectSwitcher } from "@/components/project-switcher"
import { ShellNotifications } from "@/components/shell-notifications"
import type { DataSourceMode } from "@/lib/data/types"
import type { RealtimeContext } from "@/lib/realtime/project-tables"
import type { ProjectSearchIndex } from "@/lib/search/project-search"
import type { Aktivitaet, Bauprojekt } from "@workspace/domain"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  primary?: boolean
}

const navigationGroups: ReadonlyArray<{
  label: string
  items: ReadonlyArray<NavItem>
}> = [
  {
    label: "Work",
    items: [
      { href: "/baustelle", label: "Site", icon: Smartphone },
      {
        href: "/bauarbeiter-app",
        label: "Worker app",
        icon: ClipboardCheck,
      },
      {
        href: "/bauleiter-app",
        label: "Manager app",
        icon: ClipboardList,
      },
      { href: "/", label: "Lager", icon: HardHat, primary: true },
      { href: "/cockpit", label: "Cockpit", icon: LayoutDashboard },
    ],
  },
  {
    label: "Project",
    items: [
      { href: "/planung", label: "Planning", icon: Ruler },
      { href: "/roadmap", label: "Roadmap", icon: CalendarRange },
      {
        href: "/projektzeitplan",
        label: "Projektzeitplan",
        icon: CalendarRange,
      },
      { href: "/planung/abgleich", label: "Plan comparison", icon: ScanLine },
      { href: "/standort", label: "Site", icon: MapPin },
      { href: "/betrieb", label: "Operations", icon: Building2 },
    ],
  },
  {
    label: "Control",
    items: [
      { href: "/kostenprognosen", label: "Costs", icon: Calculator },
      { href: "/risiken", label: "Risks", icon: ShieldAlert },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/aktivitaeten", label: "Log", icon: History },
      { href: "/integrationen", label: "Integrations", icon: Plug },
    ],
  },
]

function isNavItemActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

function getCurrentPageLabel(pathname: string) {
  for (const group of navigationGroups) {
    for (const item of group.items) {
      if (isNavItemActive(item.href, pathname)) {
        return item.label
      }
    }
  }

  return "Lager"
}

export function AppShell({
  children,
  dataSource = "mock",
  projectId,
  projects = [],
  aktivitaeten = [],
  realtimeContext,
  searchIndex,
}: {
  children: React.ReactNode
  dataSource?: DataSourceMode
  projectId?: string
  projects?: Bauprojekt[]
  aktivitaeten?: Aktivitaet[]
  realtimeContext?: RealtimeContext
  searchIndex?: ProjectSearchIndex
}) {
  const pathname = usePathname()
  const currentPageLabel = getCurrentPageLabel(pathname)
  const isBaustellenAnsicht =
    pathname === "/" ||
    pathname.startsWith("/baustelle") ||
    pathname.startsWith("/bauarbeiter-app") ||
    pathname.startsWith("/bauleiter-app")
  const activeProject = projects.find((project) => project.id === projectId)

  return (
    <SidebarProvider>
      {realtimeContext ? (
        <ProjectRealtimeSync
          enabled={dataSource === "supabase"}
          realtimeContext={realtimeContext}
        />
      ) : null}
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="pb-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={<Link href="/" />}
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
                    {activeProject?.name ?? "Campus West"}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          {projects.length > 0 && projectId ? (
            <div className="px-2 pb-2">
              <ProjectSwitcher
                projects={projects}
                activeProjectId={projectId}
              />
            </div>
          ) : null}
        </SidebarHeader>
        <SidebarSeparator className="mx-0" />
        <SidebarContent>
          {navigationGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isNavItemActive(item.href, pathname)}
                        render={<Link href={item.href} prefetch />}
                        tooltip={item.label}
                        className={
                          item.primary
                            ? "data-active:bg-primary data-active:text-primary-foreground"
                            : undefined
                        }
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          {activeProject ? (
            <div className="flex flex-wrap gap-1 px-2 py-1">
              <Badge variant="secondary" className="text-[10px]">
                {activeProject.phase}
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px]">
                {activeProject.status}
              </Badge>
            </div>
          ) : (
            <p className="px-2 py-1 text-xs text-muted-foreground">
              Campus West
            </p>
          )}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <p className="truncate text-sm font-medium">{currentPageLabel}</p>
          {activeProject ? (
            <div className="hidden items-center gap-1 md:flex">
              <Badge variant="secondary" className="text-[10px]">
                {activeProject.phase}
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px]">
                {activeProject.status}
              </Badge>
            </div>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            {searchIndex ? <GlobalSearch index={searchIndex} /> : null}
            {projectId ? (
              <ShellNotifications
                projectId={projectId}
                aktivitaeten={aktivitaeten}
              />
            ) : null}
          </div>
        </header>
        <div
          className={
            isBaustellenAnsicht
              ? "flex flex-1 flex-col gap-4 p-4"
              : "flex flex-1 flex-col gap-8 p-4 md:p-6"
          }
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
