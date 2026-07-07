"use client"

import type {
  Konflikt,
  PlanMarker,
  PlanMarkerTyp,
  Planversion,
} from "@workspace/domain"
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
  Layers,
  Map,
  MapPin,
  Package,
  Satellite,
  Shield,
  X,
} from "lucide-react"
import dynamic from "next/dynamic"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { ConflictStatusBadge } from "@/components/dashboard/status-badges"
import type { PlanMapViewMode } from "@/components/planung/plan-leaflet-map"
import { createPlanMarkerAction } from "@/lib/actions/project-actions"
import { getSiteGeo } from "@/lib/plan-map/site-geo"

const PlanLeafletMap = dynamic(
  () =>
    import("@/components/planung/plan-leaflet-map").then(
      (mod) => mod.PlanLeafletMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[min(560px,70vh)] animate-pulse rounded-2xl border bg-muted/20" />
    ),
  }
)

const MARKER_CONFIG: Record<
  PlanMarkerTyp,
  { label: string; color: string; ring: string; Icon: typeof AlertTriangle }
> = {
  konflikt: {
    label: "Conflict",
    color: "bg-red-500",
    ring: "ring-red-300",
    Icon: AlertTriangle,
  },
  rueckfrage: {
    label: "Follow-up",
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
    label: "Safety",
    color: "bg-orange-500",
    ring: "ring-orange-300",
    Icon: Shield,
  },
}

interface PlanAnnotationViewProps {
  planversion: Planversion
  planversionLabel: string
  standortId: string
  markers: PlanMarker[]
  konflikte: Konflikt[]
  planImageSrc?: string
}

export function PlanAnnotationView({
  planversion,
  planversionLabel,
  standortId,
  markers,
  konflikte,
  planImageSrc = "/plaene/twp-gru-1.0-plan.jpg",
}: PlanAnnotationViewProps) {
  const [viewMode, setViewMode] = useState<PlanMapViewMode>("plan")
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
  const siteGeo = getSiteGeo(standortId)

  const selectedKonflikt = selectedMarker?.konfliktId
    ? konflikte.find((k) => k.id === selectedMarker.konfliktId)
    : undefined

  function handlePlace(xPercent: number, yPercent: number) {
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
        toast.success("Marker saved.")
        setDialogOpen(false)
        setPendingPos(null)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Marker could not be saved."
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
          {placing ? "Tap the plan…" : "Place marker"}
        </Button>
        <div className="flex flex-wrap gap-1 rounded-xl border bg-muted/30 p-1">
          <Button
            type="button"
            size="sm"
            variant={viewMode === "plan" ? "default" : "ghost"}
            className="min-h-11"
            onClick={() => setViewMode("plan")}
          >
            <Layers className="mr-2 size-4" />
            Plan
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === "osm" ? "default" : "ghost"}
            className="min-h-11"
            onClick={() => setViewMode("osm")}
          >
            <Map className="mr-2 size-4" />
            OSM
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === "satellite" ? "default" : "ghost"}
            className="min-h-11"
            onClick={() => setViewMode("satellite")}
          >
            <Satellite className="mr-2 size-4" />
            Satellit
          </Button>
        </div>
      </div>

      {viewMode !== "plan" ? (
        <p className="text-xs text-muted-foreground">
          {siteGeo.label} · Marker-Positionen werden auf den Baustellen-Footprint
          gemappt ({viewMode === "satellite" ? "Satellitenbild" : "OpenStreetMap"}).
        </p>
      ) : null}

      <PlanLeafletMap
        planImageSrc={planImageSrc}
        planLabel={`Plan ${planversionLabel}`}
        siteGeo={siteGeo}
        viewMode={viewMode}
        markers={versionMarkers}
        selectedMarkerId={selectedMarker?.id}
        placing={placing}
        onPlace={handlePlace}
        onMarkerSelect={(marker) => {
          setSelectedMarker(marker)
          setPlacing(false)
        }}
      />

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
              <span className="sr-only">Close</span>
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
              <span>Linked conflict:</span>
              <ConflictStatusBadge status={selectedKonflikt.status} />
              <span className="text-muted-foreground">
                {selectedKonflikt.titel}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>
                {MARKER_CONFIG[selectedTyp].label} on plan
              </DialogTitle>
              <DialogDescription>
                Marker on {planversionLabel} at position{" "}
                {pendingPos ? `${pendingPos.x}% / ${pendingPos.y}%` : "—"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="marker-titel">Title</Label>
                <Input
                  id="marker-titel"
                  name="titel"
                  placeholder="Short description"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="marker-beschreibung">Comment</Label>
                <Textarea
                  id="marker-beschreibung"
                  name="beschreibung"
                  placeholder="What should be noted at this location?"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="marker-autor">Author</Label>
                <Input
                  id="marker-autor"
                  name="autor"
                  placeholder="Name / role"
                  defaultValue="Planning"
                />
              </div>
              {selectedTyp === "konflikt" ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="marker-prioritaet">Priority</Label>
                  <NativeSelect
                    id="marker-prioritaet"
                    name="prioritaet"
                    defaultValue="mittel"
                  >
                    <NativeSelectOption value="niedrig">Low</NativeSelectOption>
                    <NativeSelectOption value="mittel">
                      Medium
                    </NativeSelectOption>
                    <NativeSelectOption value="hoch">High</NativeSelectOption>
                    <NativeSelectOption value="kritisch">
                      Critical
                    </NativeSelectOption>
                  </NativeSelect>
                </div>
              ) : null}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending} className="min-h-11">
                {pending ? "Saving…" : "Save marker"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
