"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BriefcaseIcon, HammerIcon, HardHatIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

const PANELS = [
  {
    href: "/buero",
    label: "Büro",
    icon: BriefcaseIcon,
    description: "Baupläne & Planung",
  },
  {
    href: "/bauleitung",
    label: "Bauleitung",
    icon: HardHatIcon,
    description: "Listen, Aufträge, Live-Feed",
  },
  {
    href: "/shopfloor",
    label: "Shopfloor",
    icon: HammerIcon,
    description: "Aufträge abarbeiten",
  },
]

export function SidebarNav({ baustelleName }: { baustelleName: string }) {
  const pathname = usePathname()
  return (
    <aside className="w-64 shrink-0 border-r bg-card p-4 flex flex-col gap-6">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Baustellen-Tool
        </div>
        <div className="mt-1 font-semibold text-base leading-tight">
          {baustelleName}
        </div>
      </div>
      <nav className="space-y-1">
        {PANELS.map((p) => {
          const active =
            pathname === p.href || pathname.startsWith(`${p.href}/`)
          const Icon = p.icon
          return (
            <Link
              key={p.href}
              href={p.href}
              className={cn(
                "flex items-start gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/80 hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="font-medium">{p.label}</span>
                <span className="text-xs text-muted-foreground">
                  {p.description}
                </span>
              </div>
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto text-xs text-muted-foreground">
        <div>Demo-Modus</div>
        <div>Kein Login — Rolle über Navigation.</div>
      </div>
    </aside>
  )
}
