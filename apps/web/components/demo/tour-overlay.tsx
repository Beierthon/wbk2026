"use client"

import { X } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { TourSpotlight } from "@/components/demo/tour-spotlight"
import { findSzenario } from "@/lib/demo/szenarien"
import { Button } from "@workspace/ui/components/button"

/**
 * Schwebende Tour-Karte (#44). Liest `?tour=<id>&schritt=<n>` und zeigt den
 * aktuellen Schritt mit Zurück/Weiter/Beenden – funktioniert über
 * Seitennavigation hinweg, da im Dashboard-Layout gemountet.
 */
export function TourOverlay() {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const tourId = searchParams.get("tour")
  if (!tourId) {
    return null
  }

  const szenario = findSzenario(tourId)
  if (!szenario) {
    return null
  }

  const schrittIndex = Math.max(
    0,
    Math.min(
      szenario.schritte.length - 1,
      Number.parseInt(searchParams.get("schritt") ?? "0", 10) || 0
    )
  )
  const schritt = szenario.schritte[schrittIndex]
  if (!schritt) {
    return null
  }

  const href = (index: number) => {
    const ziel = szenario.schritte[index]?.href ?? pathname
    return `${ziel}?tour=${szenario.id}&schritt=${index}`
  }

  const istErster = schrittIndex === 0
  const istLetzter = schrittIndex === szenario.schritte.length - 1

  return (
    <>
      <TourSpotlight ziel={schritt.ziel} />
      <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[min(92vw,32rem)] rounded-2xl border bg-popover p-4 shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">
              {szenario.titel} · Schritt {schrittIndex + 1}/
              {szenario.schritte.length}
            </span>
            <span className="font-medium">{schritt.titel}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href={pathname} aria-label="Tour beenden" />}
          >
            <X />
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{schritt.beschreibung}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={istErster}
            render={<Link href={href(schrittIndex - 1)} />}
          >
            Zurück
          </Button>
          {istLetzter ? (
            <Button size="sm" render={<Link href={pathname} />}>
              Tour beenden
            </Button>
          ) : (
            <Button size="sm" render={<Link href={href(schrittIndex + 1)} />}>
              Weiter
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
