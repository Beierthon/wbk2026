"use client"

import type { ConflictStatus } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { useTransition } from "react"
import { toast } from "sonner"

import { updateKonfliktStatusAction } from "@/lib/actions/project-actions"

type BaustellenStatus = "blockiert" | "in_arbeit" | "erledigt" | "rueckfrage"

const BAUSTELLEN_STATUS: {
  key: BaustellenStatus
  label: string
  status: ConflictStatus
  variant: "default" | "secondary" | "outline" | "destructive"
}[] = [
  {
    key: "blockiert",
    label: "Blocked",
    status: "entscheidung_noetig",
    variant: "destructive",
  },
  {
    key: "in_arbeit",
    label: "In progress",
    status: "in_pruefung",
    variant: "default",
  },
  { key: "erledigt", label: "Done", status: "geloest", variant: "secondary" },
  { key: "rueckfrage", label: "Follow-up", status: "neu", variant: "outline" },
]

export function KonfliktStatusTouchButtons({
  konfliktId,
  status,
  onRueckfrage,
}: {
  konfliktId: string
  status: ConflictStatus
  onRueckfrage?: () => void
}) {
  const [pending, startTransition] = useTransition()

  function setStatus(next: ConflictStatus, label: string) {
    const formData = new FormData()
    formData.set("konfliktId", konfliktId)
    formData.set("status", next)
    formData.set("actorRolle", "bau")
    formData.set("actor", "Site (mobile)")

    startTransition(async () => {
      try {
        await updateKonfliktStatusAction(formData)
        toast.success(`Status “${label}” applied.`)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Status change failed."
        )
      }
    })
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {BAUSTELLEN_STATUS.map((item) => {
        const active = status === item.status
        return (
          <Button
            key={item.key}
            type="button"
            variant={active ? item.variant : "outline"}
            disabled={pending}
            className={cn(
              "h-12 rounded-2xl text-sm font-medium",
              active && "ring-2 ring-primary/30"
            )}
            onClick={() => {
              if (item.key === "rueckfrage" && onRueckfrage) {
                onRueckfrage()
                return
              }
              setStatus(item.status, item.label)
            }}
          >
            {pending && active ? "…" : item.label}
          </Button>
        )
      })}
    </div>
  )
}
