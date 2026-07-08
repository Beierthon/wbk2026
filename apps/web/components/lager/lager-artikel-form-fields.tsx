import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

interface LagerArtikelFormFieldsProps {
  idPrefix: string
  name: string
  maximal: number
  mindestbestand: number
  aktuell?: number
  erkennungsbegriffe?: string
  showAktuell?: boolean
}

export function LagerArtikelFormFields({
  idPrefix,
  name,
  maximal,
  mindestbestand,
  aktuell,
  erkennungsbegriffe = "",
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

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-maximal`}>Geplant (Maximum)</Label>
          <Input
            id={`${idPrefix}-maximal`}
            name="maximal"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={maximal}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-mindestbestand`}>Mindestbestand</Label>
          <Input
            id={`${idPrefix}-mindestbestand`}
            name="mindestbestand"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={mindestbestand}
            required
          />
        </div>
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
