"use client"

import type { ConflictStatus } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { useTransition } from "react"
import { toast } from "sonner"

import { updateKonfliktStatusAction } from "@/lib/actions/project-actions"

const STATUS_LABELS: Record<ConflictStatus, string> = {
  neu: "Neu",
  in_pruefung: "In Prüfung",
  entscheidung_noetig: "Entscheidung nötig",
  geloest: "Gelöst",
  uebernommen: "In Betrieb übernommen",
}

export function KonfliktStatusControl({
  konfliktId,
  status,
}: {
  konfliktId: string
  status: ConflictStatus
}) {
  const [pending, startTransition] = useTransition()

  function handleAction(formData: FormData) {
    startTransition(async () => {
      try {
        await updateKonfliktStatusAction(formData)
        toast.success("Konfliktstatus aktualisiert.")
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Statuswechsel fehlgeschlagen."
        )
      }
    })
  }

  return (
    <form action={handleAction} className="flex items-center gap-2">
      <input type="hidden" name="konfliktId" value={konfliktId} />
      <NativeSelect name="status" defaultValue={status} size="sm">
        {(Object.keys(STATUS_LABELS) as ConflictStatus[]).map((value) => (
          <NativeSelectOption key={value} value={value}>
            {STATUS_LABELS[value]}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "…" : "Setzen"}
      </Button>
    </form>
  )
}
