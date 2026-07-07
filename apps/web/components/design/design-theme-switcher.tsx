"use client"

import Link from "next/link"
import { Palette, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { DesignFontLoader } from "@/components/design/design-font-loader"
import {
  applyDesignVariant,
  getStoredDesignSlug,
  setStoredDesignSlug,
} from "@/lib/design/apply-theme"
import { designVariants, getDesignVariant } from "@/lib/design/variants"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Temporary floating control to preview design variants on the live app.
 * Remove before production.
 */
export function DesignThemeSwitcher() {
  const [open, setOpen] = useState(false)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [fontUrl, setFontUrl] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const applySlug = useCallback((slug: string | null) => {
    if (!slug) {
      applyDesignVariant(null)
      setStoredDesignSlug(null)
      setActiveSlug(null)
      setFontUrl(null)
      return
    }

    const variant = getDesignVariant(slug)
    if (!variant) {
      return
    }

    applyDesignVariant(variant)
    setStoredDesignSlug(slug)
    setActiveSlug(slug)
    setFontUrl(variant.fontUrl)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const stored = getStoredDesignSlug()
    if (stored) {
      applySlug(stored)
    }
  }, [applySlug])

  useEffect(() => {
    if (!open) {
      return
    }

    function onPointerDown(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  const activeName = activeSlug
    ? getDesignVariant(activeSlug)?.name
    : "Standard"

  if (!mounted) {
    return null
  }

  return createPortal(
    <>
      {fontUrl ? <DesignFontLoader href={fontUrl} /> : null}

      <div
        ref={panelRef}
        className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2"
      >
        {open ? (
          <div
            className="pointer-events-auto w-72 overflow-hidden rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-2xl"
            role="dialog"
            aria-label="Design wählen"
          >
            <div className="flex items-center justify-between border-b border-border/80 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Design (temp)
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                aria-label="Schließen"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-2">
              <button
                type="button"
                onClick={() => applySlug(null)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-left text-xs transition-colors",
                  activeSlug === null
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-border/60 hover:bg-muted/60"
                )}
              >
                Standard
              </button>

              {designVariants.map((variant, index) => (
                <button
                  key={variant.slug}
                  type="button"
                  onClick={() => applySlug(variant.slug)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors",
                    activeSlug === variant.slug
                      ? "border-primary bg-primary/10"
                      : "border-border/60 hover:bg-muted/60"
                  )}
                >
                  <span
                    className="size-4 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ background: variant.tokens.accent }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-medium">
                      {variant.name}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="border-t border-border/80 px-3 py-2">
              <Link
                href="/design"
                className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => setOpen(false)}
              >
                Vollbild-Vergleich →
              </Link>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium shadow-2xl ring-2 ring-primary/15 backdrop-blur",
            "hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-expanded={open}
          aria-label="Design wechseln"
        >
          <Palette className="size-4 shrink-0" style={{ color: "var(--wbk-signal)" }} />
          <span className="max-w-[9rem] truncate">{activeName}</span>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Temp
          </span>
        </button>
      </div>
    </>,
    document.body
  )
}
