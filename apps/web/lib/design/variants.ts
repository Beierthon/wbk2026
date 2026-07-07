export type DesignVariant = {
  slug: string
  name: string
  tagline: string
  taste: string
  fontUrl: string
  fontDisplay: string
  fontBody: string
  tokens: {
    bg: string
    surface: string
    text: string
    muted: string
    accent: string
    accentText: string
    border: string
    alert: string
    ok: string
    radius: string
    shadow: string
  }
  signature: string
}

export const designVariants: DesignVariant[] = [
  {
    slug: "signal-yard",
    name: "Signal Yard",
    tagline: "Hi-vis on asphalt",
    taste: "Direct · loud · site",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500&display=swap",
    fontDisplay: "'Barlow Condensed', sans-serif",
    fontBody: "'Barlow', sans-serif",
    tokens: {
      bg: "#1a1d1f",
      surface: "#24282b",
      text: "#f2f0ec",
      muted: "#8a9199",
      accent: "#f0a500",
      accentText: "#1a1d1f",
      border: "#3a4046",
      alert: "#e85d4a",
      ok: "#4caf7a",
      radius: "0.375rem",
      shadow: "0 8px 24px rgba(0,0,0,0.35)",
    },
    signature: "Amber stripe on the left of each card",
  },
  {
    slug: "blueprint",
    name: "Blueprint",
    tagline: "Plan as grid",
    taste: "Technical · precise · cool",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&family=Space+Grotesk:wght@400;500;600&display=swap",
    fontDisplay: "'JetBrains Mono', monospace",
    fontBody: "'Space Grotesk', sans-serif",
    tokens: {
      bg: "#0c1a2e",
      surface: "#112240",
      text: "#c8e6ff",
      muted: "#5a8ab0",
      accent: "#38bdf8",
      accentText: "#0c1a2e",
      border: "#1e4a6e",
      alert: "#f472b6",
      ok: "#34d399",
      radius: "0.25rem",
      shadow: "inset 0 0 0 1px rgba(56,189,248,0.15)",
    },
    signature: "Grid background like a construction drawing",
  },
  {
    slug: "dawn-fog",
    name: "Dawn Fog",
    tagline: "Morning mist on the site",
    taste: "Calm · soft · clear",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&display=swap",
    fontDisplay: "'Manrope', sans-serif",
    fontBody: "'Manrope', sans-serif",
    tokens: {
      bg: "#e8ecf1",
      surface: "#f6f8fb",
      text: "#1e2a36",
      muted: "#6b7c8f",
      accent: "#3d6df0",
      accentText: "#ffffff",
      border: "#d4dce6",
      alert: "#d64545",
      ok: "#2a9d6f",
      radius: "1rem",
      shadow: "0 4px 20px rgba(30,42,54,0.06)",
    },
    signature: "Soft glass cards with generous spacing",
  },
  {
    slug: "field-kit",
    name: "Field Kit",
    tagline: "Toolbox colours",
    taste: "Robust · earthy · tactile",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@600;700;800&display=swap",
    fontDisplay: "'Nunito Sans', sans-serif",
    fontBody: "'Nunito Sans', sans-serif",
    tokens: {
      bg: "#d8d2c4",
      surface: "#ece8df",
      text: "#2c3228",
      muted: "#6a6f62",
      accent: "#5c6b3c",
      accentText: "#f5f3ee",
      border: "#b8b2a4",
      alert: "#b54a32",
      ok: "#4a7c59",
      radius: "1.25rem",
      shadow: "0 3px 0 #b8b2a4",
    },
    signature: "Pill buttons like labels on a case",
  },
  {
    slug: "night-beacon",
    name: "Night Beacon",
    tagline: "Late-shift lamp",
    taste: "Dark · warm · focused",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&display=swap",
    fontDisplay: "'Syne', sans-serif",
    fontBody: "'Syne', sans-serif",
    tokens: {
      bg: "#0f0e0c",
      surface: "#1a1814",
      text: "#ede8df",
      muted: "#7a7468",
      accent: "#e8783a",
      accentText: "#0f0e0c",
      border: "#2e2a24",
      alert: "#ef4444",
      ok: "#6abf7b",
      radius: "0.5rem",
      shadow: "0 0 40px rgba(232,120,58,0.12)",
    },
    signature: "Glowing primary button in the centre",
  },
  {
    slug: "stamp-red",
    name: "Stamp Red",
    tagline: "Swiss stamp",
    taste: "Strict · fast · no frills",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap",
    fontDisplay: "'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
    tokens: {
      bg: "#ffffff",
      surface: "#ffffff",
      text: "#111111",
      muted: "#666666",
      accent: "#e3000f",
      accentText: "#ffffff",
      border: "#111111",
      alert: "#e3000f",
      ok: "#111111",
      radius: "0",
      shadow: "4px 4px 0 #111111",
    },
    signature: "Red header bar, hard edges",
  },
  {
    slug: "limestone",
    name: "Limestone",
    tagline: "Limestone & fir",
    taste: "Natural · stable · trustworthy",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Literata:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap",
    fontDisplay: "'Literata', serif",
    fontBody: "'DM Sans', sans-serif",
    tokens: {
      bg: "#ebe6dc",
      surface: "#f7f4ee",
      text: "#2a332c",
      muted: "#6f7a72",
      accent: "#2d5a45",
      accentText: "#f7f4ee",
      border: "#cfc8ba",
      alert: "#a63d2f",
      ok: "#2d5a45",
      radius: "0.625rem",
      shadow: "0 2px 8px rgba(42,51,44,0.08)",
    },
    signature: "Serif numbers, green accent like pine forest",
  },
  {
    slug: "steel-deck",
    name: "Steel Deck",
    tagline: "Sheet-metal panels",
    taste: "Industrial · cool · ordered",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap",
    fontDisplay: "'Rubik', sans-serif",
    fontBody: "'Rubik', sans-serif",
    tokens: {
      bg: "#c5ccd4",
      surface: "#dde2e8",
      text: "#1c2430",
      muted: "#5c6878",
      accent: "#2563a8",
      accentText: "#ffffff",
      border: "#a8b2be",
      alert: "#c43c3c",
      ok: "#2e7d5a",
      radius: "0.375rem",
      shadow: "inset 0 1px 0 #f0f3f6, inset 0 -2px 0 #a8b2be",
    },
    signature: "Recessed metal panels",
  },
  {
    slug: "copper-wire",
    name: "Copper Wire",
    tagline: "Copper line in the shaft",
    taste: "Warm · urban · craft",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&display=swap",
    fontDisplay: "'Sora', sans-serif",
    fontBody: "'Sora', sans-serif",
    tokens: {
      bg: "#2b3038",
      surface: "#363c46",
      text: "#eceae6",
      muted: "#9499a3",
      accent: "#c87941",
      accentText: "#1e2128",
      border: "#4a515c",
      alert: "#e06b5a",
      ok: "#6db88a",
      radius: "0.75rem",
      shadow: "0 6px 20px rgba(0,0,0,0.25)",
    },
    signature: "Copper underline on the active tab",
  },
  {
    slug: "volt-line",
    name: "Volt Line",
    tagline: "Line green on black",
    taste: "Energetic · sharp · night shift",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@500;600;700&display=swap",
    fontDisplay: "'IBM Plex Sans', sans-serif",
    fontBody: "'IBM Plex Sans', sans-serif",
    tokens: {
      bg: "#0a0a0a",
      surface: "#141414",
      text: "#e8e8e8",
      muted: "#737373",
      accent: "#b8ff3c",
      accentText: "#0a0a0a",
      border: "#2a2a2a",
      alert: "#ff5c5c",
      ok: "#b8ff3c",
      radius: "0.5rem",
      shadow: "0 0 0 1px rgba(184,255,60,0.2)",
    },
    signature: "Neon green active bar at the bottom",
  },
]

export function getDesignVariant(slug: string) {
  return designVariants.find((variant) => variant.slug === slug)
}
