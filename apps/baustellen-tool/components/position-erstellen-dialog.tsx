"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"

import { createPosition } from "@/app/actions/positionen"
import { EINHEITEN, EINHEIT_LABELS } from "@/lib/domain/schemas"

export function PositionErstellenDialog({ listeId }: { listeId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleAction(formData: FormData) {
    startTransition(async () => {
      try {
        await createPosition({
          liste_id: listeId,
          name: String(formData.get("name") ?? ""),
          einheit: (formData.get("einheit") as (typeof EINHEITEN)[number]) ?? "stueck",
          sollmenge: Number(formData.get("sollmenge") ?? 0),
          istmenge: Number(formData.get("istmenge") ?? 0),
          bauabschnitt: String(formData.get("bauabschnitt") ?? ""),
          beschreibung: String(formData.get("beschreibung") ?? ""),
        })
        toast.success("Position angelegt.")
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Anlegen fehlgeschlagen.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <PlusIcon /> Position
      </DialogTrigger>
      <DialogContent>
        <form action={handleAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Neue Position</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Bezeichnung</Label>
              <Input id="name" name="name" required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="einheit">Einheit</Label>
                <select
                  id="einheit"
                  name="einheit"
                  defaultValue="stueck"
                  className="h-8 rounded-2xl border bg-input/50 px-2.5 text-sm"
                >
                  {EINHEITEN.map((e) => (
                    <option key={e} value={e}>
                      {EINHEIT_LABELS[e]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sollmenge">Sollmenge</Label>
                <Input
                  id="sollmenge"
                  name="sollmenge"
                  type="number"
                  step="any"
                  min="0"
                  defaultValue="0"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bauabschnitt">Bauabschnitt</Label>
              <Input id="bauabschnitt" name="bauabschnitt" placeholder="z. B. Fassade Nord" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <Textarea id="beschreibung" name="beschreibung" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Wird gespeichert…" : "Anlegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
