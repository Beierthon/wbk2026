"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { EllipsisVertical, ScanEye, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { ActionDialog } from "@/components/forms/action-dialog"
import {
  bearbeiteLagerArtikelAction,
  loescheLagerArtikelAction,
} from "@/lib/actions/project-actions"
import type { LagerArtikel } from "@workspace/domain"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { LagerArtikelFormFields } from "./lager-artikel-form-fields"

interface LagerArtikelActionsMenuProps {
  artikel: LagerArtikel
  onDelete: (id: string) => void
}

export function LagerArtikelActionsMenu({
  artikel,
  onDelete,
}: LagerArtikelActionsMenuProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const erkennungsbegriffe = artikel.erkennungsbegriffe?.join(", ") ?? ""

  function confirmDelete() {
    startTransition(async () => {
      try {
        await loescheLagerArtikelAction(artikel.id)
        onDelete(artikel.id)
        router.refresh()
        setDeleteOpen(false)
        toast.success(`${artikel.name} entfernt`)
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Artikel konnte nicht gelöscht werden"
        )
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-9 shrink-0 touch-manipulation rounded-full sm:size-10"
              aria-label={`Aktionen für ${artikel.name}`}
            />
          }
        >
          <EllipsisVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" className="w-52">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <ScanEye />
            Erkennung bearbeiten
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Artikel löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ActionDialog
        triggerLabel=""
        title="Erkennung bearbeiten"
        description="Passe Name, Planwerte und Erkennungsbegriffe an, damit die Kamera den Artikel zuverlässig findet."
        submitLabel="Speichern"
        successMessage={`${artikel.name} aktualisiert`}
        open={editOpen}
        onOpenChange={setEditOpen}
        hideTrigger
        action={async (formData) => {
          await bearbeiteLagerArtikelAction(artikel.id, formData)
          router.refresh()
        }}
      >
        <LagerArtikelFormFields
          idPrefix={`edit-${artikel.id}`}
          name={artikel.name}
          maximal={artikel.maximal}
          mindestbestand={artikel.mindestbestand}
          erkennungsbegriffe={erkennungsbegriffe}
        />
      </ActionDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Artikel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {artikel.name} wird aus dem Lager entfernt. Der Bestand geht
              verloren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={confirmDelete}
            >
              {pending ? "Löschen…" : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
