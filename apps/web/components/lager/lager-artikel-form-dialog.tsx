"use client"

import { useRouter } from "next/navigation"

import { ActionDialog } from "@/components/forms/action-dialog"
import { erstelleLagerArtikelAction } from "@/lib/actions/project-actions"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

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
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="lager-artikel-name">Name</Label>
          <Input
            id="lager-artikel-name"
            name="name"
            placeholder="Glasflasche"
            required
            autoComplete="off"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="lager-artikel-maximal">Geplant (Maximum)</Label>
            <Input
              id="lager-artikel-maximal"
              name="maximal"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={10}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lager-artikel-mindestbestand">Mindestbestand</Label>
            <Input
              id="lager-artikel-mindestbestand"
              name="mindestbestand"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={2}
              required
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="lager-artikel-aktuell">Aktueller Bestand</Label>
          <Input
            id="lager-artikel-aktuell"
            name="aktuell"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={0}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="lager-artikel-erkennungsbegriffe">
            Erkennungsbegriffe
          </Label>
          <Input
            id="lager-artikel-erkennungsbegriffe"
            name="erkennungsbegriffe"
            placeholder="bottle, glass bottle, Banane"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Kommagetrennte Synonyme für die Kamera-Erkennung
          </p>
        </div>
      </div>
    </ActionDialog>
  )
}
