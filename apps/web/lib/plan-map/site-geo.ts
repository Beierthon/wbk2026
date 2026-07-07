/** Geographic footprint for a construction site (demo coordinates). */
export interface SiteGeo {
  center: { lat: number; lng: number }
  /** Leaflet bounds: [[south, west], [north, east]] */
  bounds: [[number, number], [number, number]]
  label: string
}

/** Demo site near Koeln — maps plan percent coords to real-world footprint. */
const SITE_GEO_BY_STANDORT: Record<string, SiteGeo> = {
  "standort-campus-west": {
    center: { lat: 50.9401, lng: 6.9574 },
    bounds: [
      [50.9393, 6.956],
      [50.9409, 6.9588],
    ],
    label: "Campus West, Baufeld 3",
  },
}

const DEFAULT_SITE_GEO: SiteGeo = SITE_GEO_BY_STANDORT["standort-campus-west"]!

export function getSiteGeo(standortId: string): SiteGeo {
  return SITE_GEO_BY_STANDORT[standortId] ?? DEFAULT_SITE_GEO
}

export function percentToGeo(
  xPercent: number,
  yPercent: number,
  bounds: SiteGeo["bounds"]
): [number, number] {
  const [[south, west], [north, east]] = bounds
  const lat = north - (yPercent / 100) * (north - south)
  const lng = west + (xPercent / 100) * (east - west)
  return [lat, lng]
}

export function geoToPercent(
  lat: number,
  lng: number,
  bounds: SiteGeo["bounds"]
): { x: number; y: number } {
  const [[south, west], [north, east]] = bounds
  const x = Math.round(((lng - west) / (east - west)) * 100)
  const y = Math.round(((north - lat) / (north - south)) * 100)
  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y)),
  }
}

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

export const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
export const SATELLITE_ATTRIBUTION =
  "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
