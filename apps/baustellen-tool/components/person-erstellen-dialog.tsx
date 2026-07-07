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

import { createPerson } from "@/app/actions/personen"
import { ROLLEN, ROLLEN_LABELS } from "@/lib/domain/schemas"

export function PersonErstellenDialog() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleAction(formData: FormData) {
    startTransition(async () => {
      try {
        await createPerson({
          name: String(formData.get("name") ?? ""),
          rolle: (formData.get("rolle") as (typeof ROLLEN)[number]) ?? "shopfloor",
        })
        toast.success("Person angelegt.")
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Anlegen fehlgeschlagen.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <PlusIcon /> Person
      </DialogTrigger>
      <DialogContent>
        <form action={handleAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Neue Person</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rolle">Rolle</Label>
              <select
                id="rolle"
                name="rolle"
                defaultValue="shopfloor"
                className="h-8 rounded-2xl border bg-input/50 px-2.5 text-sm"
              >
                {ROLLEN.map((r) => (
                  <option key={r} value={r}>
                    {ROLLEN_LABELS[r]}
                  </option>
                ))}
              </select>
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
