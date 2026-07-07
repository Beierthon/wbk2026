"use client"

import type { PlanMarkerTyp } from "@workspace/domain"
import type { PlanMarkerMitKontext } from "@/lib/data/types"
import { createPlanMarkerAction } from "@/lib/actions/project-actions"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { Textarea } from "@workspace/ui/components/textarea"
import Image from "next/image"
import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"

const MARKER_LABELS: Record<PlanMarkerTyp, string> = {
  konflikt: "Konflikt",
  rueckfrage: "Rückfrage",
  material: "Material",
  sicherheit: "Sicherheits-/Baugrundhinweis",
}

const MARKER_VARIANT: Record<
  PlanMarkerTyp,
  "default" | "secondary" | "destructive" | "outline"
> = {
  konflikt: "destructive",
  rueckfrage: "outline",
  material: "secondary",
  sicherheit: "default",
}

interface PlanAnnotationBoardProps {
  planversionId: string
  planversionLabel: string
  planImageSrc?: string
  markers: PlanMarkerMitKontext[]
}

export function PlanAnnotationBoard({
  planversionId,
  planversionLabel,
  planImageSrc = "/plan-mock/gruendung.svg",
  markers,
}: PlanAnnotationBoardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    markers[0]?.id ?? null
  )
  const [placementMode, setPlacementMode] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingPosition, setPendingPosition] = useState<{
    xPercent: number
    yPercent: number
  } | null>(null)
  const [pending, startTransition] = useTransition()

  const selected =
    markers.find((marker) => marker.id === selectedId) ?? markers[0] ?? null

  function handlePlanClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!placementMode) return

    const rect = event.currentTarget.getBoundingClientRect()
    setPendingPosition({
      xPercent: Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 10,
      yPercent: Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 10,
    })
    setDialogOpen(true)
    setPlacementMode(false)
  }

  function handleSubmit(formData: FormData) {
    formData.set("planversionId", planversionId)
    if (pendingPosition) {
      formData.set("xPercent", String(pendingPosition.xPercent))
      formData.set("yPercent", String(pendingPosition.yPercent))
    }

    startTransition(async () => {
      try {
        await createPlanMarkerAction(formData)
        toast.success("Plan-Marker gespeichert.")
        setDialogOpen(false)
        setPendingPosition(null)
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Marker konnte nicht gespeichert werden."
        )
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{planversionLabel}</Badge>
          <span className="text-sm text-muted-foreground">
            {markers.length} Marker · neue für {planversionLabel}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant={placementMode ? "default" : "outline"}
          className="min-h-11"
          onClick={() => setPlacementMode((value) => !value)}
        >
          {placementMode ? "Tippen Sie auf den Plan…" : "Marker setzen"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-2xl border bg-muted/20">
          <button
            type="button"
            className={`relative block w-full touch-manipulation ${
              placementMode ? "cursor-crosshair ring-2 ring-primary ring-offset-2" : ""
            }`}
            onClick={handlePlanClick}
            aria-label="Planfläche mit Markern"
          >
            <Image
              src={planImageSrc}
              alt={`Plan ${planversionLabel}`}
              width={800}
              height={560}
              className="h-auto w-full select-none"
              priority
            />
            {markers.map((marker) => (
              <button
                key={marker.id}
                type="button"
                className={`absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-background text-xs font-semibold shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selected?.id === marker.id
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-muted-foreground/40"
                }`}
                style={{
                  left: `${marker.xPercent}%`,
                  top: `${marker.yPercent}%`,
                }}
                onClick={(event) => {
                  event.stopPropagation()
                  setSelectedId(marker.id)
                  setPlacementMode(false)
                }}
                aria-label={`${MARKER_LABELS[marker.typ]}: ${marker.titel}`}
              >
                {marker.typ === "konflikt"
                  ? "!"
                  : marker.typ === "rueckfrage"
                    ? "?"
                    : marker.typ === "material"
                      ? "M"
                      : "S"}
              </button>
            ))}
          </button>
        </div>

        <div className="flex min-h-[12rem] flex-col gap-3 rounded-2xl border p-4">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={MARKER_VARIANT[selected.typ]}>
                  {MARKER_LABELS[selected.typ]}
                </Badge>
                {selected.planversionLabel ? (
                  <Badge variant="outline">Plan {selected.planversionLabel}</Badge>
                ) : null}
              </div>
              <p className="font-medium">{selected.titel}</p>
              {selected.kommentarText ? (
                <p className="text-sm text-muted-foreground">
                  {selected.kommentarText}
                </p>
              ) : null}
              <div className="mt-auto flex flex-col gap-2 text-sm">
                {selected.konfliktTitel ? (
                  <p>
                    <span className="text-muted-foreground">Konflikt: </span>
                    {selected.konfliktTitel}
                  </p>
                ) : null}
                {selected.kostenprognoseSumme ? (
                  <p>
                    <span className="text-muted-foreground">Kostenprognose: </span>
                    {selected.kostenprognoseSumme}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-1">
                  {selected.konfliktId ? (
                    <Button
                      render={<Link href="/planung#planung-konflikte" />}
                      size="sm"
                      variant="outline"
                    >
                      Zum Konflikt
                    </Button>
                  ) : null}
                  <Button render={<Link href="/aktivitaeten" />} size="sm" variant="ghost">
                    Aktivitätslog
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Noch keine Marker. „Marker setzen“ aktivieren und auf die Planfläche
              tippen.
            </p>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Neuer Plan-Marker</DialogTitle>
              <DialogDescription>
                Position{" "}
                {pendingPosition
                  ? `${pendingPosition.xPercent} % / ${pendingPosition.yPercent} %`
                  : "auf Plan"}{" "}
                · Version {planversionLabel}
              </DialogDescription>
            </DialogHeader>

            <input type="hidden" name="rolle" value="planung" />

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Marker-Typ</span>
              <NativeSelect name="typ" defaultValue="rueckfrage" required>
                {(Object.keys(MARKER_LABELS) as PlanMarkerTyp[]).map((typ) => (
                  <NativeSelectOption key={typ} value={typ}>
                    {MARKER_LABELS[typ]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Titel</span>
              <Input name="titel" placeholder="Kurzbeschreibung" required />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Kommentar</span>
              <Textarea
                name="kommentarText"
                placeholder="Was ist an dieser Stelle zu beachten?"
                required
              />
            </label>

            <details className="rounded-xl border p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                Optionen für Konflikt-Marker
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <Label>Priorität</Label>
                  <NativeSelect name="prioritaet" defaultValue="mittel">
                    <NativeSelectOption value="niedrig">Niedrig</NativeSelectOption>
                    <NativeSelectOption value="mittel">Mittel</NativeSelectOption>
                    <NativeSelectOption value="hoch">Hoch</NativeSelectOption>
                    <NativeSelectOption value="kritisch">Kritisch</NativeSelectOption>
                  </NativeSelect>
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label>Verantwortlich</Label>
                  <Input name="verantwortlich" placeholder="Planung Tragwerk" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label>Geschätzte Mehrkosten (Cent)</Label>
                  <Input name="kostenwirkungCent" type="number" min={0} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label>Zeitwirkung (Tage)</Label>
                  <Input name="zeitwirkungTage" type="number" min={0} />
                </label>
              </div>
            </details>

            <DialogFooter>
              <Button type="submit" disabled={pending} className="min-h-11">
                {pending ? "Wird gespeichert…" : "Marker speichern"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
