"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"

function subscribeMounted() {
  return () => {}
}

function getMountedSnapshot() {
  return true
}

function getServerMountedSnapshot() {
  return false
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    subscribeMounted,
    getMountedSnapshot,
    getServerMountedSnapshot
  )

  const isDark = mounted && resolvedTheme === "dark"
  const label = isDark ? "Hell" : "Dunkel"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="sm"
          tooltip={label}
          disabled={!mounted}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {mounted ? (
            isDark ? (
              <Sun data-icon="inline-start" />
            ) : (
              <Moon data-icon="inline-start" />
            )
          ) : (
            <Moon data-icon="inline-start" />
          )}
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
