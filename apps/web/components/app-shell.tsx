"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Building2,
  Calculator,
  HardHat,
  History,
  LayoutDashboard,
  MapPin,
  Ruler,
  ScanLine,
  ShieldAlert,
  Smartphone,
} from "lucide-react"

import { GlobalSearch } from "@/components/global-search"
import { ProjectRealtimeSync } from "@/components/project-realtime-sync"
import type { DataSourceMode } from "@/lib/data/types"
import type { ProjectSearchIndex } from "@/lib/search/project-search"
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
    label: "Arbeit",
    items: [
      { href: "/baustelle", label: "Baustelle", icon: Smartphone, primary: true },
      { href: "/bau", label: "Bau", icon: HardHat },
      { href: "/", label: "Cockpit", icon: LayoutDashboard },
    ],
  },
  {
    label: "Projekt",
    items: [
      { href: "/planung", label: "Planung", icon: Ruler },
      { href: "/planung/abgleich", label: "Plan-Abgleich", icon: ScanLine },
      { href: "/standort", label: "Standort", icon: MapPin },
      { href: "/betrieb", label: "Betrieb", icon: Building2 },
    ],
  },
  {
    label: "Steuerung",
    items: [
      { href: "/kostenprognosen", label: "Kosten", icon: Calculator },
      { href: "/risiken", label: "Risiken", icon: ShieldAlert },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/aktivitaeten", label: "Protokoll", icon: History },
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

  return "Cockpit"
}

export function AppShell({
  children,
  dataSource = "mock",
  projectId,
  searchIndex,
}: {
  children: React.ReactNode
  dataSource?: DataSourceMode
  projectId?: string
  searchIndex?: ProjectSearchIndex
}) {
  const pathname = usePathname()
  const currentPageLabel = getCurrentPageLabel(pathname)
  const isBaustelle = pathname.startsWith("/baustelle")

  return (
    <SidebarProvider>
      {projectId ? (
        <ProjectRealtimeSync
          enabled={dataSource === "supabase"}
          projectId={projectId}
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
                    Campus West
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
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
          <p className="px-2 py-1 text-xs text-muted-foreground">Campus West</p>
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
          {searchIndex ? <GlobalSearch index={searchIndex} /> : null}
        </header>
        <div
          className={
            isBaustelle
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
