"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import * as React from "react"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { SidebarMenuButton } from "@workspace/ui/components/sidebar"
import { cn } from "@workspace/ui/lib/utils"

const themeOptions = [
  { value: "light", label: "Hell", icon: Sun },
  { value: "dark", label: "Dunkel", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

type ThemeOption = (typeof themeOptions)[number]["value"]

export function ThemeToggle({
  className,
  menuSide = "bottom",
  variant = "button",
}: {
  className?: string
  menuSide?: "top" | "bottom"
  variant?: "button" | "sidebar"
}) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const activeTheme = (theme ?? "system") as ThemeOption
  const ActiveIcon = !mounted
    ? Monitor
    : activeTheme === "system"
      ? Monitor
      : activeTheme === "dark" || resolvedTheme === "dark"
        ? Moon
        : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          variant === "sidebar" ? (
            <SidebarMenuButton tooltip="Design wählen" disabled={!mounted} />
          ) : (
            <Button
              variant="ghost"
              size="icon-lg"
              className={cn(
                "shrink-0 touch-manipulation rounded-full",
                className ?? "size-11"
              )}
              aria-label="Design wählen"
              disabled={!mounted}
            />
          )
        }
      >
        <ActiveIcon className="size-5 text-current" suppressHydrationWarning />
        {variant === "sidebar" ? <span>Design</span> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        side={menuSide}
        className="w-40"
      >
        <DropdownMenuRadioGroup
          value={activeTheme}
          onValueChange={(value) => setTheme(value as ThemeOption)}
        >
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon className="size-4" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
