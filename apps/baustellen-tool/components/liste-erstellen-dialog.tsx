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

import { createBauteilliste } from "@/app/actions/bauteillisten"

export function ListeErstellenDialog({ baustelleId }: { baustelleId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleAction(formData: FormData) {
    startTransition(async () => {
      try {
        await createBauteilliste({
          baustelle_id: baustelleId,
          titel: String(formData.get("titel") ?? ""),
          typ: (formData.get("typ") as "bestand" | "fortschritt") ?? "bestand",
          beschreibung: String(formData.get("beschreibung") ?? ""),
        })
        toast.success("Liste angelegt.")
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Anlegen fehlgeschlagen.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="default" />}>
        <PlusIcon /> Liste
      </DialogTrigger>
      <DialogContent>
        <form action={handleAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Neue Bauteilliste</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="titel">Titel</Label>
              <Input id="titel" name="titel" required autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="typ">Typ</Label>
              <select
                id="typ"
                name="typ"
                defaultValue="bestand"
                className="h-8 rounded-2xl border bg-input/50 px-2.5 text-sm"
              >
                <option value="bestand">Bestand</option>
                <option value="fortschritt">Fortschritt</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <Textarea id="beschreibung" name="beschreibung" rows={3} />
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
