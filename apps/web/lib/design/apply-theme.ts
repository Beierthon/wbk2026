import type { DesignVariant } from "./variants"

const STORAGE_KEY = "wbk-design-preview"

/** CSS variables we override — must match cleanup in clearDesignVariant. */
const THEME_KEYS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--border",
  "--input",
  "--ring",
  "--radius",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
  "--wbk-signal",
  "--wbk-signal-foreground",
  "--wbk-alert",
  "--wbk-ok",
  "--font-heading",
] as const

export function getStoredDesignSlug(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  return localStorage.getItem(STORAGE_KEY)
}

export function setStoredDesignSlug(slug: string | null) {
  if (typeof window === "undefined") {
    return
  }

  if (slug) {
    localStorage.setItem(STORAGE_KEY, slug)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function applyDesignVariant(variant: DesignVariant | null) {
  const root = document.documentElement
  const body = document.body

  for (const key of THEME_KEYS) {
    root.style.removeProperty(key)
  }

  body.style.removeProperty("font-family")

  if (!variant) {
    root.removeAttribute("data-design-preview")
    return
  }

  const t = variant.tokens

  root.setAttribute("data-design-preview", variant.slug)
  root.style.setProperty("--background", t.bg)
  root.style.setProperty("--foreground", t.text)
  root.style.setProperty("--card", t.surface)
  root.style.setProperty("--card-foreground", t.text)
  root.style.setProperty("--popover", t.surface)
  root.style.setProperty("--popover-foreground", t.text)
  root.style.setProperty("--primary", t.accent)
  root.style.setProperty("--primary-foreground", t.accentText)
  root.style.setProperty("--secondary", t.surface)
  root.style.setProperty("--secondary-foreground", t.text)
  root.style.setProperty("--muted", t.surface)
  root.style.setProperty("--muted-foreground", t.muted)
  root.style.setProperty("--accent", t.accent)
  root.style.setProperty("--accent-foreground", t.accentText)
  root.style.setProperty("--destructive", t.alert)
  root.style.setProperty("--border", t.border)
  root.style.setProperty("--input", t.border)
  root.style.setProperty("--ring", t.accent)
  root.style.setProperty("--radius", t.radius)
  root.style.setProperty("--sidebar", t.surface)
  root.style.setProperty("--sidebar-foreground", t.text)
  root.style.setProperty("--sidebar-primary", t.accent)
  root.style.setProperty("--sidebar-primary-foreground", t.accentText)
  root.style.setProperty("--sidebar-accent", t.surface)
  root.style.setProperty("--sidebar-accent-foreground", t.text)
  root.style.setProperty("--sidebar-border", t.border)
  root.style.setProperty("--sidebar-ring", t.accent)
  root.style.setProperty("--wbk-signal", t.accent)
  root.style.setProperty("--wbk-signal-foreground", t.accentText)
  root.style.setProperty("--wbk-alert", t.alert)
  root.style.setProperty("--wbk-ok", t.ok)
  root.style.setProperty("--font-heading", variant.fontDisplay)
  body.style.fontFamily = variant.fontBody
}
