"use client"

import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"

const PADDING = 10
const OVERLAY_Z = 45
const RING_Z = 46

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

function measureTarget(ziel: string): SpotlightRect | null {
  const element = document.querySelector(`[data-tour="${ziel}"]`)
  if (!element) {
    return null
  }

  const rect = element.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) {
    return null
  }

  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

function holeFromRect(rect: SpotlightRect) {
  return {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  }
}

/**
 * Verdunkelt die Seite und lässt nur das Ziel-Element (`data-tour`) hell
 * hervorstechen – typischer Spotlight-Effekt für Demo-Touren.
 */
export function TourSpotlight({ ziel }: { ziel?: string }) {
  const [rect, setRect] = useState<SpotlightRect | null>(null)
  const [mounted, setMounted] = useState(false)

  const update = useCallback(() => {
    if (!ziel) {
      setRect(null)
      return
    }
    setRect(measureTarget(ziel))
  }, [ziel])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!ziel) {
      setRect(null)
      return
    }

    const element = document.querySelector(`[data-tour="${ziel}"]`)
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    element?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    })

    update()
    const settleTimer = window.setTimeout(update, 400)

    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)

    const resizeObserver = new ResizeObserver(update)
    if (element) {
      resizeObserver.observe(element)
    }

    return () => {
      window.clearTimeout(settleTimer)
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
      resizeObserver.disconnect()
    }
  }, [ziel, update])

  if (!mounted) {
    return null
  }

  const overlayClass =
    "fixed bg-foreground/55 backdrop-blur-[1px] transition-[top,left,width,height] duration-300 motion-reduce:transition-none"

  if (!ziel || !rect) {
    return createPortal(
      <div
        className="fixed inset-0 bg-foreground/55 backdrop-blur-[1px]"
        style={{ zIndex: OVERLAY_Z }}
        aria-hidden
      />,
      document.body
    )
  }

  const hole = holeFromRect(rect)

  return createPortal(
    <>
      <div
        className={overlayClass}
        style={{ top: 0, left: 0, right: 0, height: Math.max(0, hole.top), zIndex: OVERLAY_Z }}
        aria-hidden
      />
      <div
        className={overlayClass}
        style={{
          top: hole.top,
          left: 0,
          width: Math.max(0, hole.left),
          height: hole.height,
          zIndex: OVERLAY_Z,
        }}
        aria-hidden
      />
      <div
        className={overlayClass}
        style={{
          top: hole.top,
          left: hole.left + hole.width,
          right: 0,
          height: hole.height,
          zIndex: OVERLAY_Z,
        }}
        aria-hidden
      />
      <div
        className={overlayClass}
        style={{
          top: hole.top + hole.height,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: OVERLAY_Z,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed rounded-xl ring-2 ring-primary ring-offset-4 ring-offset-background transition-[top,left,width,height] duration-300 motion-reduce:transition-none"
        style={{
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
          zIndex: RING_Z,
        }}
        aria-hidden
      />
    </>,
    document.body
  )
}
