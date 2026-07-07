import type {
  Bauabschnitt,
  BauabschnittAbhaengigkeit,
  BauabschnittMitarbeiter,
  Mitarbeiter,
  MitarbeiterAusfall,
  TerminplanBlockierung,
  TerminplanSzenario,
  TerminplanVerschiebung,
} from "./construction-project"

const createdAt = "2026-07-07T08:00:00.000Z"
const updatedAt = "2026-07-07T09:30:00.000Z"

const projektId = "demo-projekt-campus-west"

export const DEMO_SZENARIO_BASELINE_ID = "szenario-baseline"
export const DEMO_SZENARIO_AKTUELL_ID = "szenario-aktuell"

export const terminplanSzenarien: TerminplanSzenario[] = [
  {
    id: DEMO_SZENARIO_BASELINE_ID,
    createdAt,
    updatedAt,
    projektId,
    name: "Baseline 1.0",
    typ: "baseline",
    istAktiv: false,
    beschreibung: "Eingefrorener Ausgangs-Terminplan vor Baugrundkonflikt.",
  },
  {
    id: DEMO_SZENARIO_AKTUELL_ID,
    createdAt,
    updatedAt,
    projektId,
    name: "Aktueller Plan",
    typ: "aktuell",
    istAktiv: true,
    beschreibung: "Aktiver Terminplan mit Verschiebungen aus Baugrundkonflikt.",
  },
]

function abschnitt(
  id: string,
  titel: string,
  gewerk: Bauabschnitt["gewerk"],
  start: string,
  ende: string,
  opts: Partial<Bauabschnitt> = {}
): Bauabschnitt {
  const dauer = Math.max(
    1,
    Math.round(
      (new Date(ende).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000)
    )
  )
  return {
    id,
    createdAt,
    updatedAt,
    projektId,
    szenarioId: DEMO_SZENARIO_AKTUELL_ID,
    titel,
    beschreibung: opts.beschreibung ?? "",
    gewerk,
    status: opts.status ?? "geplant",
    geplanterStart: start,
    geplantesEnde: ende,
    dauerTage: dauer,
    pufferTage: opts.pufferTage ?? 2,
    prioritaet: opts.prioritaet ?? "mittel",
    verantwortlich: opts.verantwortlich ?? "Bauleitung",
    konfliktIds: opts.konfliktIds ?? [],
    materialIds: opts.materialIds ?? [],
    assetIds: opts.assetIds ?? [],
    planversionId: opts.planversionId,
    istStart: opts.istStart,
    istEnde: opts.istEnde,
  }
}

export const bauabschnitte: Bauabschnitt[] = [
  abschnitt("bauabschnitt-erdarbeiten", "Erdarbeiten und Baugrube", "erdarbeiten", "2026-07-15", "2026-08-15", {
    status: "laufend",
    istStart: "2026-07-15",
    prioritaet: "kritisch",
    verantwortlich: "Tiefbau Nord",
  }),
  abschnitt("bauabschnitt-gruendung", "Gründung und Bodenplatte", "rohbau", "2026-08-16", "2026-10-01", {
    status: "bereit",
    prioritaet: "kritisch",
    planversionId: "planversion-gruendung-v2",
    konfliktIds: ["konflikt-baugrund-suedfeld"],
    materialIds: ["material-drainagevlies"],
    pufferTage: 3,
  }),
  abschnitt("bauabschnitt-rohbau", "Rohbau Kern", "rohbau", "2026-10-02", "2027-01-15", {
    prioritaet: "hoch",
    pufferTage: 5,
  }),
  abschnitt("bauabschnitt-tga-rohr", "TGA Rohinstallation", "tga", "2026-11-01", "2027-02-28", {
    prioritaet: "mittel",
    pufferTage: 4,
  }),
  abschnitt("bauabschnitt-fassade", "Fassade und Fenster", "ausbau", "2027-01-16", "2027-03-15", {
    prioritaet: "mittel",
  }),
  abschnitt("bauabschnitt-innenausbau", "Innenausbau EG/OG", "ausbau", "2027-02-01", "2027-03-31", {
    prioritaet: "mittel",
    pufferTage: 3,
  }),
  abschnitt("bauabschnitt-tga-end", "TGA Endmontage", "tga", "2027-03-01", "2027-04-10", {
    prioritaet: "hoch",
  }),
  abschnitt("bauabschnitt-aussen", "Außenanlagen", "aussenanlagen", "2027-03-15", "2027-04-20", {
    prioritaet: "niedrig",
    pufferTage: 7,
  }),
  abschnitt("bauabschnitt-uebergabe", "Übergabe und Abnahme", "uebergabe", "2027-04-21", "2027-04-30", {
    prioritaet: "kritisch",
    assetIds: ["asset-drainage-suedfeld"],
  }),
]

export const bauabschnittAbhaengigkeiten: BauabschnittAbhaengigkeit[] = [
  {
    id: "abhaengigkeit-1",
    createdAt,
    updatedAt,
    projektId,
    vorgaengerId: "bauabschnitt-erdarbeiten",
    nachfolgerId: "bauabschnitt-gruendung",
    typ: "finish_to_start",
    lagTage: 1,
  },
  {
    id: "abhaengigkeit-2",
    createdAt,
    updatedAt,
    projektId,
    vorgaengerId: "bauabschnitt-gruendung",
    nachfolgerId: "bauabschnitt-rohbau",
    typ: "finish_to_start",
    lagTage: 1,
  },
  {
    id: "abhaengigkeit-3",
    createdAt,
    updatedAt,
    projektId,
    vorgaengerId: "bauabschnitt-rohbau",
    nachfolgerId: "bauabschnitt-fassade",
    typ: "finish_to_start",
    lagTage: 0,
  },
  {
    id: "abhaengigkeit-4",
    createdAt,
    updatedAt,
    projektId,
    vorgaengerId: "bauabschnitt-rohbau",
    nachfolgerId: "bauabschnitt-tga-rohr",
    typ: "start_to_start",
    lagTage: 30,
  },
  {
    id: "abhaengigkeit-5",
    createdAt,
    updatedAt,
    projektId,
    vorgaengerId: "bauabschnitt-fassade",
    nachfolgerId: "bauabschnitt-innenausbau",
    typ: "finish_to_start",
    lagTage: 0,
  },
  {
    id: "abhaengigkeit-6",
    createdAt,
    updatedAt,
    projektId,
    vorgaengerId: "bauabschnitt-tga-rohr",
    nachfolgerId: "bauabschnitt-tga-end",
    typ: "finish_to_start",
    lagTage: 0,
  },
  {
    id: "abhaengigkeit-7",
    createdAt,
    updatedAt,
    projektId,
    vorgaengerId: "bauabschnitt-innenausbau",
    nachfolgerId: "bauabschnitt-uebergabe",
    typ: "finish_to_start",
    lagTage: 0,
  },
  {
    id: "abhaengigkeit-8",
    createdAt,
    updatedAt,
    projektId,
    vorgaengerId: "bauabschnitt-tga-end",
    nachfolgerId: "bauabschnitt-uebergabe",
    typ: "finish_to_start",
    lagTage: 0,
  },
]

export const terminplanVerschiebungen: TerminplanVerschiebung[] = [
  {
    id: "verschiebung-gruendung-konflikt",
    createdAt: "2026-07-07T09:00:00.000Z",
    updatedAt,
    projektId,
    bauabschnittId: "bauabschnitt-gruendung",
    szenarioId: DEMO_SZENARIO_AKTUELL_ID,
    konfliktId: "konflikt-baugrund-suedfeld",
    ursache: "konflikt",
    strategie: "kaskade",
    tageVerschoben: 4,
    grund: "Baugrundabweichung Suedfeld erfordert Drainagenacharbeit und Plananpassung.",
    entschiedenVon: "WBK Demo-Projektsteuerung",
    kostenwirkungCent: 970_000,
    zeitwirkungKumuliertTage: 4,
    vorherStart: "2026-08-12",
    vorherEnde: "2026-09-27",
    nachherStart: "2026-08-16",
    nachherEnde: "2026-10-01",
  },
  {
    id: "verschiebung-rohbau-kaskade",
    createdAt: "2026-07-07T09:05:00.000Z",
    updatedAt,
    projektId,
    bauabschnittId: "bauabschnitt-rohbau",
    szenarioId: DEMO_SZENARIO_AKTUELL_ID,
    konfliktId: "konflikt-baugrund-suedfeld",
    ursache: "abhaengigkeit",
    strategie: "kaskade",
    tageVerschoben: 4,
    grund: "Kaskadierte Verschiebung aus Gründungsabschnitt.",
    entschiedenVon: "WBK Demo-Projektsteuerung",
    zeitwirkungKumuliertTage: 4,
    vorherStart: "2026-09-28",
    vorherEnde: "2027-01-11",
    nachherStart: "2026-10-02",
    nachherEnde: "2027-01-15",
  },
]

export const terminplanBlockierungen: TerminplanBlockierung[] = [
  {
    id: "blockierung-gruendung-konflikt",
    createdAt: "2026-07-07T08:30:00.000Z",
    updatedAt,
    projektId,
    bauabschnittId: "bauabschnitt-gruendung",
    blockiertDurchTyp: "konflikt",
    blockiertDurchId: "konflikt-baugrund-suedfeld",
    blockiertSeit: "2026-07-07",
    geschaetztFreiAb: "2026-08-10",
    status: "aktiv",
  },
]

export const mitarbeiter: Mitarbeiter[] = [
  {
    id: "mitarbeiter-tiefbau-lead",
    createdAt,
    updatedAt,
    projektId,
    name: "K. Meier",
    rolle: "Polier Tiefbau",
    gewerk: "erdarbeiten",
    stundensatzCent: 5200,
    wochenstunden: 40,
  },
  {
    id: "mitarbeiter-rohbau-lead",
    createdAt,
    updatedAt,
    projektId,
    name: "S. Braun",
    rolle: "Bauleiter Rohbau",
    gewerk: "rohbau",
    stundensatzCent: 6800,
    wochenstunden: 42,
  },
  {
    id: "mitarbeiter-tga",
    createdAt,
    updatedAt,
    projektId,
    name: "L. Hoffmann",
    rolle: "TGA-Meister",
    gewerk: "tga",
    stundensatzCent: 6100,
    wochenstunden: 40,
  },
]

export const mitarbeiterAusfaelle: MitarbeiterAusfall[] = [
  {
    id: "ausfall-rohbau-krank",
    createdAt,
    updatedAt,
    projektId,
    mitarbeiterId: "mitarbeiter-rohbau-lead",
    von: "2026-10-15",
    bis: "2026-10-22",
    grund: "krank",
    ausfallProzent: 100,
  },
]

export const bauabschnittMitarbeiter: BauabschnittMitarbeiter[] = [
  {
    id: "zuordnung-erdarbeiten",
    createdAt,
    updatedAt,
    projektId,
    bauabschnittId: "bauabschnitt-erdarbeiten",
    mitarbeiterId: "mitarbeiter-tiefbau-lead",
    geplanteStunden: 320,
  },
  {
    id: "zuordnung-gruendung",
    createdAt,
    updatedAt,
    projektId,
    bauabschnittId: "bauabschnitt-gruendung",
    mitarbeiterId: "mitarbeiter-tiefbau-lead",
    geplanteStunden: 480,
  },
  {
    id: "zuordnung-rohbau",
    createdAt,
    updatedAt,
    projektId,
    bauabschnittId: "bauabschnitt-rohbau",
    mitarbeiterId: "mitarbeiter-rohbau-lead",
    geplanteStunden: 1200,
  },
  {
    id: "zuordnung-tga",
    createdAt,
    updatedAt,
    projektId,
    bauabschnittId: "bauabschnitt-tga-rohr",
    mitarbeiterId: "mitarbeiter-tga",
    geplanteStunden: 640,
  },
]
