import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

interface LieferantFormFieldsProps {
  idPrefix: string
  name?: string
  kontakt?: string
}

export function LieferantFormFields({
  idPrefix,
  name = "",
  kontakt = "",
}: LieferantFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          defaultValue={name}
          placeholder="Campus Baustoff AG"
          required
          autoComplete="organization"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-kontakt`}>Kontakt</Label>
        <Input
          id={`${idPrefix}-kontakt`}
          name="kontakt"
          defaultValue={kontakt}
          placeholder="einkauf@lieferant.de"
          autoComplete="email"
        />
        <p className="text-xs text-muted-foreground">
          E-Mail oder Telefon — optional.
        </p>
      </div>
    </div>
  )
}
