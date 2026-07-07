export interface TourSchritt {
  titel: string
  beschreibung: string
  href: string
  /** `data-tour`-Kennung des hervorgehobenen UI-Bereichs */
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
 * Geführte Demo-Szenarien (#44–#48). Jeder Schritt verlinkt eine bestehende
 * Seite mit `?tour=<id>&schritt=<n>`, damit die Tour-Overlay den Fortschritt
 * anzeigen kann.
 */
export const DEMO_SZENARIEN: DemoSzenario[] = [
  {
    id: "baukonflikt",
    titel: "Baukonflikt von Planung bis Betreiberübergabe",
    kurz: "Bau meldet Baugrundproblem, Planung passt an, Betrieb sieht die Entscheidung.",
    dauer: "2–3 Minuten",
    schritte: [
      {
        titel: "Ausgangslage im Cockpit",
        beschreibung: "Projektstatus, offene Konflikte und Domänen im Überblick.",
        href: "/",
        ziel: "cockpit-kennzahlen",
      },
      {
        titel: "Baustelle meldet Konflikt",
        beschreibung: "Im Bau-Dashboard einen Baugrundkonflikt melden oder kommentieren.",
        href: "/bau",
        ziel: "bau-konflikt-melden",
      },
      {
        titel: "Planung reagiert",
        beschreibung: "Konflikt beantworten und eine angepasste Planversion veröffentlichen.",
        href: "/planung",
        ziel: "planung-konflikte",
      },
      {
        titel: "Risiko und Entscheidung",
        beschreibung: "In der Risikomatrix priorisieren und die Entscheidung dokumentieren.",
        href: "/risiken",
        ziel: "risiko-matrix",
      },
      {
        titel: "Betreiberübergabe",
        beschreibung: "Entscheidung, Herkunft und Wartungsfolgen im Betrieb nachvollziehen.",
        href: "/betrieb",
        ziel: "betrieb-assets",
      },
      {
        titel: "Audit Trail",
        beschreibung: "Alle Änderungen mit Vorher/Nachher und Quelle im Aktivitätslog.",
        href: "/aktivitaeten",
        ziel: "aktivitaeten-audit",
      },
    ],
  },
  {
    id: "material",
    titel: "Materialanalyse und Kostenabweichung",
    kurz: "Geplant, verbaut, Schwund, Nachkauf und Prognosewirkung nachvollziehen.",
    dauer: "2 Minuten",
    schritte: [
      {
        titel: "Materialstatus",
        beschreibung: "Bestand, kritische Positionen und ERP-Referenzen im Bau-Dashboard.",
        href: "/bau",
        ziel: "bau-material",
      },
      {
        titel: "Analytics-Cockpit",
        beschreibung: "Schwundquote, Nachkauf und die fünf Challenge-Fragen gegen die Baseline.",
        href: "/analytics",
        ziel: "analytics-challenge",
      },
      {
        titel: "Kostenprognosen",
        beschreibung: "Mehrkosten je Kategorie mit Annahmen und Konfidenz.",
        href: "/kostenprognosen",
        ziel: "kostenprognosen-uebersicht",
      },
    ],
  },
  {
    id: "kamera",
    titel: "Baustellenkamera und System-Update",
    kurz: "Kamera-Scan erkennt Material, Bestätigung aktualisiert den Bestand.",
    dauer: "2 Minuten",
    schritte: [
      {
        titel: "Kamera-/Demo-Scan",
        beschreibung: "Im Bau-Dashboard den Kamera- oder Demo-Modus starten.",
        href: "/bau",
        ziel: "bau-kamera",
      },
      {
        titel: "Bestätigen und übernehmen",
        beschreibung: "Erkannte Mengen prüfen und ins System übernehmen.",
        href: "/bau",
        ziel: "bau-kamera",
      },
      {
        titel: "Wirkung in Analytics",
        beschreibung: "Aktualisierte Mengen und Kostenwirkung im Cockpit sehen.",
        href: "/analytics",
        ziel: "analytics-kennzahlen",
      },
    ],
  },
  {
    id: "betrieb",
    titel: "Betreiberübergabe, Assets und Wartung",
    kurz: "Aus Planung und Bau entsteht eine nutzbare Betriebsakte.",
    dauer: "2 Minuten",
    schritte: [
      {
        titel: "Betreiber-Dashboard",
        beschreibung: "Assets mit Herkunft, Wartungsstatus und offenen Punkten.",
        href: "/betrieb",
        ziel: "betrieb-kennzahlen",
      },
      {
        titel: "Asset übergeben",
        beschreibung: "Ein Asset an den Betrieb übergeben – erscheint in der Historie.",
        href: "/betrieb",
        ziel: "betrieb-uebergabe",
      },
      {
        titel: "Nachweis im Audit Trail",
        beschreibung: "Warum wurde was entschieden? Vollständig nachvollziehbar.",
        href: "/aktivitaeten",
        ziel: "aktivitaeten-timeline",
      },
    ],
  },
]

export function findSzenario(id: string): DemoSzenario | undefined {
  return DEMO_SZENARIEN.find((szenario) => szenario.id === id)
}
