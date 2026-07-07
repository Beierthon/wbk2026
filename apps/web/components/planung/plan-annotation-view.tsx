"use client"

import type { Konflikt, PlanMarker, PlanMarkerTyp, Planversion } from "@workspace/domain"
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
import {
  AlertTriangle,
  HelpCircle,
  MapPin,
  Package,
  Shield,
  X,
} from "lucide-react"
import Image from "next/image"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { ConflictStatusBadge } from "@/components/dashboard/status-badges"
import { createPlanMarkerAction } from "@/lib/actions/project-actions"

const MARKER_CONFIG: Record<
  PlanMarkerTyp,
  { label: string; color: string; ring: string; Icon: typeof AlertTriangle }
> = {
  konflikt: {
    label: "Konflikt",
    color: "bg-red-500",
    ring: "ring-red-300",
    Icon: AlertTriangle,
  },
  rueckfrage: {
    label: "Rückfrage",
    color: "bg-blue-500",
    ring: "ring-blue-300",
    Icon: HelpCircle,
  },
  material: {
    label: "Material",
    color: "bg-amber-500",
    ring: "ring-amber-300",
    Icon: Package,
  },
  sicherheit: {
    label: "Sicherheit",
    color: "bg-orange-500",
    ring: "ring-orange-300",
    Icon: Shield,
  },
}

interface PlanAnnotationViewProps {
  planversion: Planversion
  planversionLabel: string
  markers: PlanMarker[]
  konflikte: Konflikt[]
  planImageSrc?: string
}

export function PlanAnnotationView({
  planversion,
  planversionLabel,
  markers,
  konflikte,
  planImageSrc = "/plaene/gruendung-placeholder.svg",
}: PlanAnnotationViewProps) {
  const [placing, setPlacing] = useState(false)
  const [selectedTyp, setSelectedTyp] = useState<PlanMarkerTyp>("konflikt")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(
    null
  )
  const [selectedMarker, setSelectedMarker] = useState<PlanMarker | null>(null)
  const [pending, startTransition] = useTransition()

  const versionMarkers = markers.filter(
    (m) => m.planversionId === planversion.id
  )

  const selectedKonflikt = selectedMarker?.konfliktId
    ? konflikte.find((k) => k.id === selectedMarker.konfliktId)
    : undefined

  function handlePlanClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!placing) return
    const rect = e.currentTarget.getBoundingClientRect()
    const xPercent = Math.round(
      ((e.clientX - rect.left) / rect.width) * 100
    )
    const yPercent = Math.round(
      ((e.clientY - rect.top) / rect.height) * 100
    )
    setPendingPos({ x: xPercent, y: yPercent })
    setDialogOpen(true)
    setPlacing(false)
  }

  function handleSubmit(formData: FormData) {
    if (!pendingPos) return
    formData.set("planversionId", planversion.id)
    formData.set("typ", selectedTyp)
    formData.set("xPercent", String(pendingPos.x))
    formData.set("yPercent", String(pendingPos.y))
    formData.set("rolle", "planung")

    startTransition(async () => {
      try {
        await createPlanMarkerAction(formData)
        toast.success("Marker gespeichert.")
        setDialogOpen(false)
        setPendingPos(null)
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
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="font-mono">
          {planversionLabel}
        </Badge>
        <Badge variant="secondary">{versionMarkers.length} Marker</Badge>
        <div className="ml-auto flex flex-wrap gap-2">
          {(
            Object.entries(MARKER_CONFIG) as [
              PlanMarkerTyp,
              (typeof MARKER_CONFIG)[PlanMarkerTyp],
            ][]
          ).map(([typ, cfg]) => (
            <Badge key={typ} variant="outline" className="gap-1">
              <span className={`size-2 rounded-full ${cfg.color}`} />
              {cfg.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <NativeSelect
          value={selectedTyp}
          onChange={(e) => setSelectedTyp(e.target.value as PlanMarkerTyp)}
          className="min-h-11 min-w-[140px]"
        >
          {(Object.keys(MARKER_CONFIG) as PlanMarkerTyp[]).map((typ) => (
            <NativeSelectOption key={typ} value={typ}>
              {MARKER_CONFIG[typ].label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button
          type="button"
          variant={placing ? "default" : "outline"}
          className="min-h-11"
          onClick={() => {
            setPlacing((v) => !v)
            setSelectedMarker(null)
          }}
        >
          <MapPin className="mr-2 size-4" />
          {placing ? "Tippen Sie auf den Plan…" : "Marker setzen"}
        </Button>
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl border bg-muted/20 ${
          placing ? "cursor-crosshair ring-2 ring-primary" : ""
        }`}
        onClick={handlePlanClick}
        role="presentation"
      >
        <Image
          src={planImageSrc}
          alt={`Plan ${planversionLabel}`}
          width={800}
          height={560}
          className="h-auto w-full select-none"
          priority
        />
        {versionMarkers.map((marker) => {
          const cfg = MARKER_CONFIG[marker.typ]
          const isSelected = selectedMarker?.id === marker.id

          return (
            <button
              key={marker.id}
              type="button"
              className={`absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${cfg.color} ${isSelected ? `ring-4 ${cfg.ring}` : ""}`}
              style={{
                left: `${marker.xPercent}%`,
                top: `${marker.yPercent}%`,
              }}
              title={marker.titel}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedMarker(marker)
                setPlacing(false)
              }}
            >
              <cfg.Icon className="size-5" aria-hidden />
              <span className="sr-only">{marker.titel}</span>
            </button>
          )
        })}
      </div>

      {selectedMarker ? (
        <div className="flex flex-col gap-2 rounded-2xl border bg-muted/30 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={`${MARKER_CONFIG[selectedMarker.typ].color} text-white`}
              >
                {MARKER_CONFIG[selectedMarker.typ].label}
              </Badge>
              <span className="font-medium">{selectedMarker.titel}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-11 shrink-0"
              onClick={() => setSelectedMarker(null)}
            >
              <X className="size-4" />
              <span className="sr-only">Schließen</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedMarker.beschreibung}
          </p>
          <p className="text-xs text-muted-foreground">
            {selectedMarker.autor} · Position {selectedMarker.xPercent}% /{" "}
            {selectedMarker.yPercent}%
          </p>
          {selectedMarker.konfliktId && selectedKonflikt ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>Verknüpfter Konflikt:</span>
              <ConflictStatusBadge status={selectedKonflikt.status} />
              <span className="text-muted-foreground">{selectedKonflikt.titel}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>
                {MARKER_CONFIG[selectedTyp].label} markieren
              </DialogTitle>
              <DialogDescription>
                Marker auf {planversionLabel} bei Position{" "}
                {pendingPos
                  ? `${pendingPos.x}% / ${pendingPos.y}%`
                  : "—"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="marker-titel">Titel</Label>
                <Input
                  id="marker-titel"
                  name="titel"
                  placeholder="Kurzbeschreibung"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="marker-beschreibung">Kommentar</Label>
                <Textarea
                  id="marker-beschreibung"
                  name="beschreibung"
                  placeholder="Was ist an dieser Stelle zu beachten?"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="marker-autor">Autor</Label>
                <Input
                  id="marker-autor"
                  name="autor"
                  placeholder="Name / Rolle"
                  defaultValue="Planung"
                />
              </div>
              {selectedTyp === "konflikt" ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="marker-prioritaet">Priorität</Label>
                  <NativeSelect
                    id="marker-prioritaet"
                    name="prioritaet"
                    defaultValue="mittel"
                  >
                    <NativeSelectOption value="niedrig">Niedrig</NativeSelectOption>
                    <NativeSelectOption value="mittel">Mittel</NativeSelectOption>
                    <NativeSelectOption value="hoch">Hoch</NativeSelectOption>
                    <NativeSelectOption value="kritisch">Kritisch</NativeSelectOption>
                  </NativeSelect>
                </div>
              ) : null}
            </div>
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
