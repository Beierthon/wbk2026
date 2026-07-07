"use client"

import Link from "next/link"
import { Bell } from "lucide-react"

import { ActivityKindBadge } from "@/components/dashboard/activity-badges"
import { formatGermanDateTime } from "@/components/dashboard/formatters"
import type { Aktivitaet } from "@workspace/domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export function ShellNotifications({
  aktivitaeten,
}: {
  aktivitaeten: Aktivitaet[]
}) {
  const recent = aktivitaeten.slice(0, 5)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon-sm" className="relative shrink-0" />
        }
      >
        <Bell className="size-4" />
        {recent.length > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {Math.min(recent.length, 9)}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Aktuelle Ereignisse</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recent.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            Keine aktuellen Aktivitäten im Projekt.
          </p>
        ) : (
          recent.map((aktivitaet) => (
            <DropdownMenuItem key={aktivitaet.id} className="items-start py-2">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <ActivityKindBadge art={aktivitaet.art} />
                  <span className="truncate text-sm font-medium">
                    {aktivitaet.titel}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {aktivitaet.beschreibung}
                </p>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {formatGermanDateTime(aktivitaet.createdAt)}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/aktivitaeten" />}>
          <Badge variant="outline">Protokoll öffnen</Badge>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
