import type { Lieferant } from "@workspace/domain"
import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"

interface LieferantSelectFieldProps {
  idPrefix: string
  lieferanten: Lieferant[]
  lieferantId?: string
}

export function LieferantSelectField({
  idPrefix,
  lieferanten,
  lieferantId,
}: LieferantSelectFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`${idPrefix}-lieferant`}>Lieferant</Label>
      <select
        id={`${idPrefix}-lieferant`}
        name="lieferantId"
        defaultValue={lieferantId ?? ""}
        className={cn(
          "border-input bg-background ring-offset-background",
          "focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm",
          "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <option value="">Kein Lieferant</option>
        {lieferanten.map((lieferant) => (
          <option key={lieferant.id} value={lieferant.id}>
            {lieferant.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        Optional — für Nachbestellungen und ERP-Übersicht.
      </p>
    </div>
  )
}
