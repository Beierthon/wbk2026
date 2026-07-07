"use client"

import { useRef, useState, useTransition } from "react"

import { formatEuroFromCent } from "@/components/dashboard/formatters"
import {
  previewVerschiebungAction,
  verschiebeBauabschnittAction,
} from "@/lib/actions/terminplan-actions"
import type { BauabschnittMitKontext } from "@/lib/data/types"
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
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Textarea } from "@workspace/ui/components/textarea"

interface VerschiebungsDialogProps {
  abschnitt: BauabschnittMitKontext
  konfliktId?: string
}

export function VerschiebungsDialog({ abschnitt, konfliktId }: VerschiebungsDialogProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<{
    betroffeneAnzahl: number
    betroffeneTitel: string[]
    warnungen: string[]
    geschaetzteMehrkostenCent: number
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  function runPreview() {
    if (!formRef.current) return
    startTransition(async () => {
      const result = await previewVerschiebungAction(new FormData(formRef.current!))
      setPreview(result)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="sm" variant="outline" />}
      >
        Verschieben
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Verschiebung: {abschnitt.titel}</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={verschiebeBauabschnittAction}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="bauabschnittId" value={abschnitt.id} />
          {konfliktId ? <input type="hidden" name="konfliktId" value={konfliktId} /> : null}

          <div className="grid gap-2">
            <Label htmlFor={`tage-${abschnitt.id}`}>Tage verschieben</Label>
            <Input id={`tage-${abschnitt.id}`} name="tage" type="number" defaultValue={4} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`strategie-${abschnitt.id}`}>Strategie</Label>
            <NativeSelect id={`strategie-${abschnitt.id}`} name="strategie" defaultValue="kaskade">
              <NativeSelectOption value="manuell">Manuell (nur dieser Abschnitt)</NativeSelectOption>
              <NativeSelectOption value="kaskade">Kaskade (mit Nachfolgern)</NativeSelectOption>
              <NativeSelectOption value="parallelisieren">Parallelisieren (Puffer nutzen)</NativeSelectOption>
              <NativeSelectOption value="priorisieren">Priorisieren</NativeSelectOption>
              <NativeSelectOption value="scope_reduzieren">Scope reduzieren</NativeSelectOption>
              <NativeSelectOption value="ressourcen_umverteilen">Ressourcen umverteilen</NativeSelectOption>
            </NativeSelect>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`ursache-${abschnitt.id}`}>Ursache</Label>
            <NativeSelect
              id={`ursache-${abschnitt.id}`}
              name="ursache"
              defaultValue={konfliktId ? "konflikt" : "manuell"}
            >
              <NativeSelectOption value="konflikt">Konflikt</NativeSelectOption>
              <NativeSelectOption value="material_verzug">Materialverzug</NativeSelectOption>
              <NativeSelectOption value="mitarbeiter_ausfall">Mitarbeiterausfall</NativeSelectOption>
              <NativeSelectOption value="wetter">Wetter</NativeSelectOption>
              <NativeSelectOption value="genehmigung">Genehmigung</NativeSelectOption>
              <NativeSelectOption value="manuell">Manuell</NativeSelectOption>
              <NativeSelectOption value="abhaengigkeit">Abhängigkeit</NativeSelectOption>
            </NativeSelect>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`grund-${abschnitt.id}`}>Begründung</Label>
            <Textarea
              id={`grund-${abschnitt.id}`}
              name="grund"
              placeholder="Warum wird verschoben?"
              required
            />
          </div>

          {preview ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="font-medium">
                Vorschau: {preview.betroffeneAnzahl} Abschnitt(e) betroffen
              </p>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                {preview.betroffeneTitel.map((titel) => (
                  <li key={titel}>{titel}</li>
                ))}
              </ul>
              <p className="mt-2">
                Geschätzte Mehrkosten:{" "}
                {formatEuroFromCent(preview.geschaetzteMehrkostenCent)}
              </p>
              {preview.warnungen.length > 0 ? (
                <ul className="mt-1 text-amber-700 dark:text-amber-400">
                  {preview.warnungen.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="secondary" disabled={isPending} onClick={runPreview}>
              Vorschau
            </Button>
            <Button type="submit" disabled={isPending}>
              Verschiebung anwenden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
