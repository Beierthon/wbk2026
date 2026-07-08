"use client"

import { useRouter } from "next/navigation"

import { ActionDialog } from "@/components/forms/action-dialog"
import { erstelleLieferantAction } from "@/lib/actions/project-actions"

import { LieferantFormFields } from "./lieferant-form-fields"

interface LieferantFormDialogProps {
  triggerClassName?: string
}

export function LieferantFormDialog({
  triggerClassName,
}: LieferantFormDialogProps) {
  const router = useRouter()

  return (
    <ActionDialog
      triggerLabel="Lieferant hinzufügen"
      triggerVariant="outline"
      triggerSize="sm"
      triggerClassName={triggerClassName}
      title="Lieferant anlegen"
      description="Lege einen neuen Lieferanten für dieses Projekt an. Artikel können danach zugeordnet werden."
      submitLabel="Lieferant speichern"
      successMessage="Lieferant angelegt"
      action={async (formData) => {
        await erstelleLieferantAction(formData)
        router.refresh()
      }}
    >
      <LieferantFormFields idPrefix="create-lieferant" />
    </ActionDialog>
  )
}
