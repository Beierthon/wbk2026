"use client"

import type { PlanMarker, PlanMarkerTyp } from "@workspace/domain"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "./plan-leaflet-map.css"
import { useEffect } from "react"
import {
  ImageOverlay,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet"

import {
  latLngToPercent,
  percentToLatLng,
  PLAN_BOUNDS,
} from "@/lib/plan-map/coordinates"
import {
  geoToPercent,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  percentToGeo,
  SATELLITE_ATTRIBUTION,
  SATELLITE_TILE_URL,
  type SiteGeo,
} from "@/lib/plan-map/site-geo"

export type PlanMapViewMode = "plan" | "osm" | "satellite"

const MARKER_COLORS: Record<PlanMarkerTyp, { bg: string; ring: string }> = {
  konflikt: { bg: "#ef4444", ring: "#fca5a5" },
  rueckfrage: { bg: "#3b82f6", ring: "#93c5fd" },
  material: { bg: "#f59e0b", ring: "#fcd34d" },
  sicherheit: { bg: "#f97316", ring: "#fdba74" },
}

function createMarkerIcon(
  typ: PlanMarkerTyp,
  selected: boolean,
  title: string
): L.DivIcon {
  const { bg, ring } = MARKER_COLORS[typ]
  const ringStyle = selected
    ? `box-shadow: 0 0 0 4px ${ring};`
    : "box-shadow: 0 2px 8px rgba(0,0,0,0.35);"

  return L.divIcon({
    className: "",
    html: `<div
      title="${title.replace(/"/g, "&quot;")}"
      style="
        width: 44px;
        height: 44px;
        border-radius: 9999px;
        background: ${bg};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: pointer;
        ${ringStyle}
        transition: transform 0.15s ease;
      "
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  })
}

function FitPlanBounds() {
  const map = useMap()

  useEffect(() => {
    map.fitBounds(PLAN_BOUNDS, { padding: [8, 8] })
  }, [map])

  return null
}

function FitGeoBounds({ bounds }: { bounds: SiteGeo["bounds"] }) {
  const map = useMap()

  useEffect(() => {
    map.fitBounds(bounds, { padding: [24, 24] })
  }, [map, bounds])

  return null
}

function PlacingCursor({ placing }: { placing: boolean }) {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    if (placing) {
      container.classList.add("plan-map-placing")
    } else {
      container.classList.remove("plan-map-placing")
    }
    return () => container.classList.remove("plan-map-placing")
  }, [map, placing])

  return null
}

function PlanMapInteractionLayer({
  placing,
  onPlace,
}: {
  placing: boolean
  onPlace: (xPercent: number, yPercent: number) => void
}) {
  useMapEvents({
    click(e) {
      if (!placing) return
      const pos = latLngToPercent(e.latlng.lat, e.latlng.lng)
      onPlace(pos.x, pos.y)
    },
  })

  return null
}

function GeoMapInteractionLayer({
  placing,
  siteGeo,
  onPlace,
}: {
  placing: boolean
  siteGeo: SiteGeo
  onPlace: (xPercent: number, yPercent: number) => void
}) {
  useMapEvents({
    click(e) {
      if (!placing) return
      const pos = geoToPercent(e.latlng.lat, e.latlng.lng, siteGeo.bounds)
      onPlace(pos.x, pos.y)
    },
  })

  return null
}

function MarkerLayer({
  markers,
  selectedMarkerId,
  viewMode,
  siteGeo,
  onMarkerSelect,
}: {
  markers: PlanMarker[]
  selectedMarkerId?: string
  viewMode: PlanMapViewMode
  siteGeo: SiteGeo
  onMarkerSelect: (marker: PlanMarker) => void
}) {
  return (
    <>
      {markers.map((marker) => {
        const position =
          viewMode === "plan"
            ? percentToLatLng(marker.xPercent, marker.yPercent)
            : percentToGeo(marker.xPercent, marker.yPercent, siteGeo.bounds)

        return (
          <Marker
            key={marker.id}
            position={position}
            icon={createMarkerIcon(
              marker.typ,
              selectedMarkerId === marker.id,
              marker.titel
            )}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e.originalEvent)
                onMarkerSelect(marker)
              },
            }}
          />
        )
      })}
    </>
  )
}

export interface PlanLeafletMapProps {
  planImageSrc: string
  planLabel: string
  siteGeo: SiteGeo
  viewMode: PlanMapViewMode
  markers: PlanMarker[]
  selectedMarkerId?: string
  placing: boolean
  onPlace: (xPercent: number, yPercent: number) => void
  onMarkerSelect: (marker: PlanMarker) => void
}

export function PlanLeafletMap({
  planImageSrc,
  planLabel,
  siteGeo,
  viewMode,
  markers,
  selectedMarkerId,
  placing,
  onPlace,
  onMarkerSelect,
}: PlanLeafletMapProps) {
  const mapClassName = `h-[min(560px,70vh)] w-full ${placing ? "ring-2 ring-primary" : ""}`

  if (viewMode === "plan") {
    return (
      <div className="plan-leaflet-shell overflow-hidden rounded-2xl border bg-muted/20">
        <MapContainer
          key="plan-map"
          crs={L.CRS.Simple}
          bounds={PLAN_BOUNDS}
          maxBounds={PLAN_BOUNDS}
          maxBoundsViscosity={1}
          minZoom={-2}
          maxZoom={4}
          zoomControl
          scrollWheelZoom
          className={mapClassName}
          attributionControl={false}
        >
          <ImageOverlay url={planImageSrc} bounds={PLAN_BOUNDS} alt={planLabel} />
          <FitPlanBounds />
          <PlacingCursor placing={placing} />
          <PlanMapInteractionLayer placing={placing} onPlace={onPlace} />
          <MarkerLayer
            markers={markers}
            selectedMarkerId={selectedMarkerId}
            viewMode={viewMode}
            siteGeo={siteGeo}
            onMarkerSelect={onMarkerSelect}
          />
        </MapContainer>
      </div>
    )
  }

  const isSatellite = viewMode === "satellite"

  return (
    <div className="plan-leaflet-shell overflow-hidden rounded-2xl border bg-muted/20">
      <MapContainer
        key={`geo-map-${viewMode}`}
        center={siteGeo.center}
        zoom={18}
        minZoom={15}
        maxZoom={20}
        zoomControl
        scrollWheelZoom
        className={mapClassName}
      >
        <TileLayer
          url={isSatellite ? SATELLITE_TILE_URL : OSM_TILE_URL}
          attribution={isSatellite ? SATELLITE_ATTRIBUTION : OSM_ATTRIBUTION}
          maxZoom={20}
        />
        <FitGeoBounds bounds={siteGeo.bounds} />
        <PlacingCursor placing={placing} />
        <GeoMapInteractionLayer
          placing={placing}
          siteGeo={siteGeo}
          onPlace={onPlace}
        />
        <MarkerLayer
          markers={markers}
          selectedMarkerId={selectedMarkerId}
          viewMode={viewMode}
          siteGeo={siteGeo}
          onMarkerSelect={onMarkerSelect}
        />
      </MapContainer>
    </div>
  )
}
