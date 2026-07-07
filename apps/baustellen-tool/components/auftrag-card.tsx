import Link from "next/link"
import { CameraIcon, ClipboardListIcon, FileTextIcon, UserIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

import {
  AUFTRAG_STATUS_LABELS,
  AUFTRAG_TYP_LABELS,
  EINHEIT_LABELS,
} from "@/lib/domain/schemas"
import type { AuftragStatus, AuftragTyp, Einheit } from "@/lib/domain/schemas"
import { formatMenge, formatRelative } from "@/lib/format"

const TYP_ICON = {
  bestand: ClipboardListIcon,
  fortschritt: CameraIcon,
  freitext: FileTextIcon,
} as const

const STATUS_BADGE: Record<AuftragStatus, string> = {
  offen: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  in_arbeit: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  abgeschlossen: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  abgebrochen: "bg-muted text-muted-foreground",
}

export interface AuftragCardData {
  id: string
  titel: string
  typ: AuftragTyp
  status: AuftragStatus
  created_at: string
  person_name: string | null
  position_name: string | null
  position_einheit: string | null
  position_sollmenge: number | null
  liste_titel: string | null
}

export function AuftragCard({
  auftrag,
  href,
  compact = false,
}: {
  auftrag: AuftragCardData
  href: string
  compact?: boolean
}) {
  const Icon = TYP_ICON[auftrag.typ]
  return (
    <Link
      href={href}
      className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="font-medium leading-tight">{auftrag.titel}</div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                STATUS_BADGE[auftrag.status],
              )}
            >
              {AUFTRAG_STATUS_LABELS[auftrag.status]}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {AUFTRAG_TYP_LABELS[auftrag.typ]}
            {auftrag.liste_titel ? ` · ${auftrag.liste_titel}` : ""}
            {auftrag.position_name ? ` · ${auftrag.position_name}` : ""}
          </div>
          {!compact && auftrag.position_sollmenge != null && (
            <div className="text-xs text-muted-foreground">
              Soll:{" "}
              {formatMenge(
                auftrag.position_sollmenge,
                (auftrag.position_einheit ?? "") as Einheit,
              )}
              {auftrag.position_einheit &&
              !(auftrag.position_einheit in EINHEIT_LABELS)
                ? ` ${auftrag.position_einheit}`
                : ""}
            </div>
          )}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <UserIcon className="h-3 w-3" />
              {auftrag.person_name ?? "unzugewiesen"}
            </span>
            <span>{formatRelative(auftrag.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
