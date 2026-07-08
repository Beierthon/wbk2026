"use client"

import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import { ActionDialog } from "@/components/forms/action-dialog"
import { erstelleLagerArtikelAction } from "@/lib/actions/project-actions"
import type { Lieferant } from "@workspace/domain"
import { cn } from "@workspace/ui/lib/utils"

import { LagerArtikelFormFields } from "./lager-artikel-form-fields"

interface LagerArtikelFormDialogProps {
  lieferanten?: Lieferant[]
  triggerClassName?: string
  triggerMode?: "button" | "icon"
}

export function LagerArtikelFormDialog({
  lieferanten = [],
  triggerClassName,
  triggerMode = "button",
}: LagerArtikelFormDialogProps) {
  const router = useRouter()
  const isIcon = triggerMode === "icon"

  return (
    <ActionDialog
      triggerLabel="Artikel hinzufügen"
      triggerVariant={isIcon ? "ghost" : "outline"}
      triggerSize={isIcon ? "icon-sm" : "sm"}
      triggerClassName={cn(
        isIcon && "size-8 touch-manipulation",
        triggerClassName
      )}
      triggerIcon={isIcon ? <Plus className="size-4" /> : undefined}
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
        lieferanten={lieferanten}
        showAktuell
      />
    </ActionDialog>
  )
}
