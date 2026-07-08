"use client"

import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

type CooperationRole = "worker" | "planner" | "maintainer"

const roles: Array<{ id: CooperationRole; label: string; href: string }> = [
  { id: "worker", label: "Worker", href: "/worker/overview" },
  { id: "planner", label: "Planner", href: "/planner/overview" },
  { id: "maintainer", label: "Maintainer", href: "/maintainer/overview" },
]

export function CooperationThread({
  currentRole,
  konfliktTitel,
}: {
  currentRole: CooperationRole
  konfliktTitel: string
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-3">
      <p className="text-xs text-muted-foreground">
        Gemeinsam an <span className="font-medium text-foreground">{konfliktTitel}</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {roles.map((role) => (
          <Link
            key={role.id}
            href={role.href}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              role.id === currentRole
                ? "border-[var(--status-signal)] bg-[var(--status-signal)]/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {role.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
