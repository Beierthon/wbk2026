"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"
import {
  BarChart3,
  Building2,
  Calculator,
  HardHat,
  History,
  LayoutDashboard,
  MapPin,
  PlayCircle,
  Ruler,
  ShieldAlert,
  Smartphone,
} from "lucide-react"

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

import {
  ProjectRealtimeSync,
  type RealtimeSyncStatus,
} from "@/components/project-realtime-sync"
import { ThemeToggle } from "@/components/theme-toggle"
import type { DataSourceMode } from "@/lib/data/types"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType
  highlight?: boolean
}

const navigationGroups: ReadonlyArray<{
  label: string
  items: ReadonlyArray<NavItem>
}> = [
  {
    label: "Arbeit",
    items: [
      {
        href: "/baustelle",
        label: "Baustelle",
        icon: Smartphone,
        highlight: true,
      },
      {
        href: "/bau",
        label: "Bau",
        icon: HardHat,
      },
      {
        href: "/",
        label: "Cockpit",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Projekt",
    items: [
      { href: "/planung", label: "Planung", icon: Ruler },
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
  {
    label: "Hilfe",
    items: [{ href: "/demo", label: "Demo", icon: PlayCircle }],
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

function getFooterLabel(
  dataSource: DataSourceMode,
  realtimeStatus: RealtimeSyncStatus
) {
  if (dataSource === "mock") {
    return "Demo-Daten"
  }

  if (realtimeStatus === "live") {
    return "Live · Supabase"
  }

  if (realtimeStatus === "connecting") {
    return "Verbinde …"
  }

  if (realtimeStatus === "error") {
    return "Offline"
  }

  return "Supabase"
}

export function AppShell({
  children,
  dataSource = "mock",
  projectId,
}: {
  children: React.ReactNode
  dataSource?: DataSourceMode
  projectId?: string
}) {
  const pathname = usePathname()
  const [realtimeStatus, setRealtimeStatus] =
    React.useState<RealtimeSyncStatus>("idle")
  const currentPageLabel = getCurrentPageLabel(pathname)
  const isBaustelle = pathname.startsWith("/baustelle")

  return (
    <SidebarProvider>
      {projectId ? (
        <ProjectRealtimeSync
          enabled={dataSource === "supabase"}
          projectId={projectId}
          onStatusChange={setRealtimeStatus}
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
                  <span className="truncate font-heading font-semibold">
                    WBK 2026
                  </span>
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
                          item.highlight
                            ? "data-active:bg-[var(--wbk-signal)] data-active:text-[var(--wbk-signal-foreground)]"
                            : "data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
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
        <SidebarSeparator className="mx-0" />
        <SidebarFooter>
          <ThemeToggle />
          <p className="px-2 text-xs text-muted-foreground">
            {getFooterLabel(dataSource, realtimeStatus)}
          </p>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/80 px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-semibold">
              {currentPageLabel}
            </p>
          </div>
        </header>
        <div
          className={
            isBaustelle
              ? "flex flex-1 flex-col p-3 md:p-4"
              : "flex flex-1 flex-col gap-5 p-4 md:gap-6 md:p-6"
          }
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
