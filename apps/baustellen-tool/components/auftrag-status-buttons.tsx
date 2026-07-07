"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { CheckIcon, XIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { deleteArbeitsauftrag, updateAuftragStatus } from "@/app/actions/arbeitsauftraege"
import type { AuftragStatus } from "@/lib/domain/schemas"

export function AuftragStatusButtons({
  id,
  status,
}: {
  id: string
  status: AuftragStatus
}) {
  const [pending, startTransition] = useTransition()

  function change(next: AuftragStatus) {
    startTransition(async () => {
      try {
        await updateAuftragStatus(id, next)
        toast.success(`Auftrag: ${next}`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Aktion fehlgeschlagen.")
      }
    })
  }

  function remove() {
    if (!window.confirm("Auftrag wirklich löschen?")) return
    startTransition(async () => {
      try {
        await deleteArbeitsauftrag(id)
        toast.success("Auftrag gelöscht.")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Löschen fehlgeschlagen.")
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "abgeschlossen" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => change("abgeschlossen")}
        >
          <CheckIcon /> Manuell abschließen
        </Button>
      )}
      {status !== "abgebrochen" && status !== "abgeschlossen" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => change("abgebrochen")}
        >
          <XIcon /> Abbrechen
        </Button>
      )}
      {(status === "abgebrochen" || status === "abgeschlossen") && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => change("offen")}
        >
          Wieder öffnen
        </Button>
      )}
      <Button size="sm" variant="destructive" disabled={pending} onClick={remove}>
        Löschen
      </Button>
    </div>
  )
}
