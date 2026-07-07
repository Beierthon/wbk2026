export interface TourSchritt {
  titel: string
  beschreibung: string
  href: string
  /** `data-tour` target for highlighted UI areas */
  ziel?: string
}

export interface DemoSzenario {
  id: string
  titel: string
  kurz: string
  dauer: string
  schritte: TourSchritt[]
}

/**
 * Guided demo scenarios (#44–#48). Each step links to an existing page with
 * `?tour=<id>&schritt=<n>` so the tour overlay can show progress.
 */
export const DEMO_SZENARIEN: DemoSzenario[] = [
  {
    id: "baukonflikt",
    titel: "Construction conflict from planning to operator handover",
    kurz: "Construction reports a soil issue, planning adapts, operations sees the decision.",
    dauer: "2–3 minutes",
    schritte: [
      {
        titel: "Starting point in cockpit",
        beschreibung:
          "Project status, open conflicts, and domains at a glance.",
        href: "/",
        ziel: "cockpit-kennzahlen",
      },
      {
        titel: "Site reports conflict",
        beschreibung:
          "Report or comment on a soil conflict in the construction dashboard.",
        href: "/bau",
        ziel: "bau-konflikt-melden",
      },
      {
        titel: "Planning responds",
        beschreibung:
          "Answer the conflict and publish an adapted plan version.",
        href: "/planung",
        ziel: "planung-konflikte",
      },
      {
        titel: "Risk and decision",
        beschreibung:
          "Prioritise in the risk matrix and document the decision.",
        href: "/risiken",
        ziel: "risiko-matrix",
      },
      {
        titel: "Operator handover",
        beschreibung:
          "Trace decision, origin, and maintenance implications in operations.",
        href: "/betrieb",
        ziel: "betrieb-assets",
      },
      {
        titel: "Audit trail",
        beschreibung:
          "All changes with before/after values and source in the activity log.",
        href: "/aktivitaeten",
        ziel: "aktivitaeten-audit",
      },
    ],
  },
  {
    id: "material",
    titel: "Material analysis and cost variance",
    kurz: "Track planned vs installed quantities, shrinkage, reorders, and forecast impact.",
    dauer: "2 minutes",
    schritte: [
      {
        titel: "Material status",
        beschreibung:
          "Stock, critical items, and ERP references in the construction dashboard.",
        href: "/bau",
        ziel: "bau-material",
      },
      {
        titel: "Analytics cockpit",
        beschreibung:
          "Shrinkage rate, reorders, and the five challenge questions against baseline.",
        href: "/analytics",
        ziel: "analytics-challenge",
      },
      {
        titel: "Cost forecasts",
        beschreibung:
          "Extra costs by category with assumptions and confidence.",
        href: "/kostenprognosen",
        ziel: "kostenprognosen-uebersicht",
      },
    ],
  },
  {
    id: "kamera",
    titel: "Site camera, error list, and construction management",
    kurz: "Camera scan detects primitives, workers confirm yes/no, managers see larger issues.",
    dauer: "2 minutes",
    schritte: [
      {
        titel: "Camera / demo scan",
        beschreibung:
          "Start camera or demo mode in the construction dashboard.",
        href: "/bau",
        ziel: "bau-kamera",
      },
      {
        titel: "Worker reviews error list",
        beschreibung:
          "Confirm classification errors with yes/no answers and capture comments.",
        href: "/bauarbeiter-app",
        ziel: "worker-fehlerliste",
      },
      {
        titel: "Manager sees escalations",
        beschreibung:
          "Analyze reorders, wrong parts, plan approval, and schedule risk.",
        href: "/bauleiter-app",
        ziel: "bauleiter-escalations",
      },
      {
        titel: "Impact in analytics",
        beschreibung: "See updated quantities and cost impact in the cockpit.",
        href: "/analytics",
        ziel: "analytics-kennzahlen",
      },
    ],
  },
  {
    id: "betrieb",
    titel: "Operator handover, assets, and maintenance",
    kurz: "Planning and construction feed into a usable operations record.",
    dauer: "2 minutes",
    schritte: [
      {
        titel: "Operations dashboard",
        beschreibung: "Assets with origin, maintenance status, and open items.",
        href: "/betrieb",
        ziel: "betrieb-kennzahlen",
      },
      {
        titel: "Hand over asset",
        beschreibung:
          "Hand an asset to operations — it appears in the history.",
        href: "/betrieb",
        ziel: "betrieb-uebergabe",
      },
      {
        titel: "Evidence in audit trail",
        beschreibung: "Why was what decided? Fully traceable.",
        href: "/aktivitaeten",
        ziel: "aktivitaeten-timeline",
      },
    ],
  },
]

export function findSzenario(id: string): DemoSzenario | undefined {
  return DEMO_SZENARIEN.find((szenario) => szenario.id === id)
}
