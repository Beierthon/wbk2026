"use client"

import { useRouter } from "next/navigation"

import { ActionDialog } from "@/components/forms/action-dialog"
import { erstelleLagerArtikelAction } from "@/lib/actions/project-actions"

import { LagerArtikelFormFields } from "./lager-artikel-form-fields"

interface LagerArtikelFormDialogProps {
  triggerClassName?: string
}

export function LagerArtikelFormDialog({
  triggerClassName,
}: LagerArtikelFormDialogProps) {
  const router = useRouter()

  return (
    <ActionDialog
      triggerLabel="Artikel hinzufügen"
      triggerVariant="outline"
      triggerSize="sm"
      triggerClassName={triggerClassName}
      title="Lagerartikel anlegen"
      description="Lege einen neuen Artikel an. Erkennungsbegriffe helfen der Kamera, Synonyme wie bottle oder Banane zuzuordnen."
      submitLabel="Artikel speichern"
      successMessage="Lagerartikel angelegt"
      action={async (formData) => {
        await erstelleLagerArtikelAction(formData)
        router.refresh()
      }}
    >
      <LagerArtikelFormFields
        idPrefix="create"
        name=""
        geplant={10}
        aktuell={0}
        showAktuell
      />
    </ActionDialog>
  )
}
