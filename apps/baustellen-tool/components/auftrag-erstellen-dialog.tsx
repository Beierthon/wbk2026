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

import { createArbeitsauftrag } from "@/app/actions/arbeitsauftraege"
import type { AuftragTyp, BauteilPosition, Bauteilliste, Person } from "@/lib/domain/schemas"

interface Props {
  baustelleId: string
  personen: Person[]
  listen: Bauteilliste[]
  positionenByListe: Record<string, BauteilPosition[]>
  triggerLabel?: string
  defaultTyp?: AuftragTyp
  defaultListeId?: string
  defaultPositionId?: string
}

export function AuftragErstellenDialog({
  baustelleId,
  personen,
  listen,
  positionenByListe,
  triggerLabel = "Auftrag",
  defaultTyp = "bestand",
  defaultListeId,
  defaultPositionId,
}: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [listeId, setListeId] = useState<string>(defaultListeId ?? "")
  const [positionId, setPositionId] = useState<string>(defaultPositionId ?? "")

  const positionenFuerListe = listeId ? positionenByListe[listeId] ?? [] : []

  function handleAction(formData: FormData) {
    startTransition(async () => {
      try {
        await createArbeitsauftrag({
          baustelle_id: baustelleId,
          typ: (formData.get("typ") as AuftragTyp) ?? "bestand",
          titel: String(formData.get("titel") ?? ""),
          beschreibung: String(formData.get("beschreibung") ?? ""),
          zugewiesen_an: (String(formData.get("zugewiesen_an") ?? "") || null) as
            | string
            | null,
          bezug_liste_id: listeId || null,
          bezug_position_id: positionId || null,
          erstellt_von: String(formData.get("erstellt_von") ?? "Bauleitung"),
        })
        toast.success("Auftrag angelegt.")
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Anlegen fehlgeschlagen.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon /> {triggerLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form action={handleAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Neuer Arbeitsauftrag</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="titel">Titel</Label>
              <Input id="titel" name="titel" required autoFocus />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="typ">Typ</Label>
                <select
                  id="typ"
                  name="typ"
                  defaultValue={defaultTyp}
                  className="h-8 rounded-2xl border bg-input/50 px-2.5 text-sm"
                >
                  <option value="bestand">Bestandsprüfung</option>
                  <option value="fortschritt">Fortschrittsprüfung</option>
                  <option value="freitext">Freitext-Kontrolle</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="zugewiesen_an">Zuweisen an</Label>
                <select
                  id="zugewiesen_an"
                  name="zugewiesen_an"
                  className="h-8 rounded-2xl border bg-input/50 px-2.5 text-sm"
                  defaultValue=""
                >
                  <option value="">— frei —</option>
                  {personen.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="liste">Bauteilliste</Label>
                <select
                  id="liste"
                  className="h-8 rounded-2xl border bg-input/50 px-2.5 text-sm"
                  value={listeId}
                  onChange={(e) => {
                    setListeId(e.target.value)
                    setPositionId("")
                  }}
                >
                  <option value="">— keine —</option>
                  {listen.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.titel} ({l.typ})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="position">Position</Label>
                <select
                  id="position"
                  className="h-8 rounded-2xl border bg-input/50 px-2.5 text-sm"
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                  disabled={!listeId}
                >
                  <option value="">— keine —</option>
                  {positionenFuerListe.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <Textarea id="beschreibung" name="beschreibung" rows={3} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="erstellt_von">Erstellt von</Label>
              <Input
                id="erstellt_von"
                name="erstellt_von"
                defaultValue="Bauleitung"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Wird gespeichert…" : "Auftrag anlegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
