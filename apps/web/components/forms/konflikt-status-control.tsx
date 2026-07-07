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
  neu: "New",
  in_pruefung: "Under review",
  entscheidung_noetig: "Decision required",
  geloest: "Resolved",
  uebernommen: "Adopted into operations",
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
        toast.success("Conflict status updated.")
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Status change failed."
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
        {pending ? "…" : "Apply"}
      </Button>
    </form>
  )
}
