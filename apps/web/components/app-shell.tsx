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
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { Separator } from "@workspace/ui/components/separator"

import {
  ProjectRealtimeSync,
  type RealtimeSyncStatus,
} from "@/components/project-realtime-sync"
import { ThemeToggle } from "@/components/theme-toggle"
import type { DataSourceMode } from "@/lib/data/types"

const navigation = [
  {
    href: "/",
    label: "Projekt-Cockpit",
    icon: LayoutDashboard,
  },
  {
    href: "/planung",
    label: "Planung",
    icon: Ruler,
  },
  {
    href: "/bau",
    label: "Bau",
    icon: HardHat,
  },
  {
    href: "/standort",
    label: "Standort",
    icon: MapPin,
  },
  {
    href: "/betrieb",
    label: "Betrieb",
    icon: Building2,
  },
  {
    href: "/kostenprognosen",
    label: "Kostenprognosen",
    icon: Calculator,
  },
  {
    href: "/risiken",
    label: "Risiken",
    icon: ShieldAlert,
  },
  {
    href: "/aktivitaeten",
    label: "Aktivitaeten",
    icon: History,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/baustelle",
    label: "Baustelle (mobil)",
    icon: Smartphone,
  },
] as const

function getFooterLabel(
  dataSource: DataSourceMode,
  realtimeStatus: RealtimeSyncStatus
) {
  if (dataSource === "mock") {
    return "Mock-Daten ueber Repository-Schicht"
  }

  if (realtimeStatus === "live") {
    return "Supabase · Realtime aktiv"
  }

  if (realtimeStatus === "connecting") {
    return "Supabase · Realtime verbindet"
  }

  if (realtimeStatus === "error") {
    return "Supabase · Realtime nicht erreichbar"
  }

  return "Supabase · Repository-Schicht"
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
        <SidebarHeader>
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
                  <span className="truncate font-medium">WBK 2026</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Campus West Demo
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Projektbereiche</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={
                        item.href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.href)
                      }
                      render={<Link href={item.href} />}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <ThemeToggle />
          <p className="px-2 text-xs text-muted-foreground">
            {getFooterLabel(dataSource, realtimeStatus)}
          </p>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <p className="text-sm text-muted-foreground">
            Operatives Projekt-Cockpit
          </p>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
