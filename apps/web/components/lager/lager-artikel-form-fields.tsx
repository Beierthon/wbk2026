import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import type { Lieferant } from "@workspace/domain"

import { LieferantSelectField } from "./lieferant-select-field"

interface LagerArtikelFormFieldsProps {
  idPrefix: string
  name: string
  geplant: number
  aktuell?: number
  erkennungsbegriffe?: string
  lieferantId?: string
  lieferanten?: Lieferant[]
  showAktuell?: boolean
}

export function LagerArtikelFormFields({
  idPrefix,
  name,
  geplant,
  aktuell,
  erkennungsbegriffe = "",
  lieferantId,
  lieferanten = [],
  showAktuell = false,
}: LagerArtikelFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          defaultValue={name}
          placeholder="Glasflasche"
          required
          autoComplete="off"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-maximal`}>Geplant</Label>
        <Input
          id={`${idPrefix}-maximal`}
          name="maximal"
          type="number"
          min={0}
          inputMode="numeric"
          defaultValue={geplant}
          required
        />
        <p className="text-xs text-muted-foreground">
          Vorgeplanter Bestand — Referenz für die Ampel-Anzeige.
        </p>
      </div>

      {showAktuell ? (
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-aktuell`}>Aktueller Bestand</Label>
          <Input
            id={`${idPrefix}-aktuell`}
            name="aktuell"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={aktuell ?? 0}
          />
        </div>
      ) : null}

      <LieferantSelectField
        idPrefix={idPrefix}
        lieferanten={lieferanten}
        lieferantId={lieferantId}
      />

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-erkennungsbegriffe`}>
          Erkennungsbegriffe
        </Label>
        <Input
          id={`${idPrefix}-erkennungsbegriffe`}
          name="erkennungsbegriffe"
          defaultValue={erkennungsbegriffe}
          placeholder="bottle, glass bottle, Banane"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Kommagetrennte Begriffe für die Kamera-Erkennung (z. B. COCO-Klassen
          wie bottle oder banana)
        </p>
      </div>
    </div>
  )
}
