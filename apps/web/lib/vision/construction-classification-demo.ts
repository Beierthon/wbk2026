export type PrimitiveRecognitionCategory =
  | "bestand"
  | "neues_teil"
  | "planaenderung"

export type RecognitionSeverity = "ok" | "warnung" | "kritisch"

export type LeadIssueType =
  | "nachbestellung"
  | "zeitplan"
  | "falsches_teil"
  | "planfreigabe"

export interface PrimitiveRecognitionClassification {
  id: string
  category: PrimitiveRecognitionCategory
  title: string
  location: string
  question: string
  expected: string
  recognized: string
  confidence: number
  scannerFrame: string
  backendPrimitive: string
  planComparison: string
  errorOptions: string[]
  negativeInputLabel: string
  negativePlaceholder: string
  defaultNegativeValue: string
  escalationIds: string[]
}

export interface LeadEscalationMetric {
  label: string
  value: string
}

export interface LeadEscalation {
  id: string
  type: LeadIssueType
  severity: RecognitionSeverity
  title: string
  status: string
  location: string
  sourceTaskIds: string[]
  problem: string
  evidence: string
  impact: string
  owner: string
  due: string
  recommendation: string
  metrics: LeadEscalationMetric[]
}

export const CLASSIFICATION_CATEGORY_META: Record<
  PrimitiveRecognitionCategory,
  {
    label: string
    shortLabel: string
  }
> = {
  bestand: {
    label: "Bestand",
    shortLabel: "Bestand XY",
  },
  neues_teil: {
    label: "Neues Teil",
    shortLabel: "Teil eingebaut",
  },
  planaenderung: {
    label: "Planaenderung",
    shortLabel: "Planwechsel",
  },
}

export const RECOGNITION_PIPELINE = [
  "Handy-Kamera",
  "Scanner-Webseite",
  "Frames an Backend",
  "Primitive Recognition",
  "Planvergleich",
  "Fehlerliste",
  "Live-Dashboard + Worker-App",
] as const

export const PRIMITIVE_RECOGNITION_CLASSIFICATIONS: PrimitiveRecognitionClassification[] =
  [
    {
      id: "bestand-stahl-b500b",
      category: "bestand",
      title: "Bestand B500B Stahl",
      location: "Lagerzone Nord",
      question: "Ist der Bestand B500B Stahl korrekt?",
      expected: "Soll: 6 Paletten B500B fuer Achse B3",
      recognized: "Recognition: 4 Paletten B500B, 84% sicher",
      confidence: 84,
      scannerFrame: "Frame 12:21:08, Kamera Worker-02",
      backendPrimitive: "material_inventory",
      planComparison: "Planvergleich: 2 Paletten fehlen fuer Schalung B3",
      errorOptions: [
        "Menge falsch",
        "Material fehlt",
        "Ort falsch",
        "Bild unscharf",
      ],
      negativeInputLabel: "Wie viel ist tatsaechlich da?",
      negativePlaceholder: "z.B. 4 Paletten",
      defaultNegativeValue: "4 Paletten",
      escalationIds: ["lead-nachbestellung-material", "lead-zeitplan-b3"],
    },
    {
      id: "bestand-beton-c3037",
      category: "bestand",
      title: "Bestand Beton C30/37",
      location: "Fundamentstreifen C, Silo West",
      question: "Ist der Bestand Beton C30/37 korrekt?",
      expected: "Soll: 38 t Beton C30/37 bis 14:00 Uhr",
      recognized: "Recognition: 28 t sichtbar, 91% sicher",
      confidence: 91,
      scannerFrame: "Frame 12:22:44, Kamera Worker-02",
      backendPrimitive: "material_inventory",
      planComparison: "Planvergleich: 10 t fehlen fuer heutigen Betonierabschnitt",
      errorOptions: [
        "Menge falsch",
        "Lieferung fehlt",
        "Material verwechselt",
        "Schon verbaut",
      ],
      negativeInputLabel: "Wie viel ist tatsaechlich da?",
      negativePlaceholder: "z.B. 28 t",
      defaultNegativeValue: "28 t",
      escalationIds: ["lead-nachbestellung-material", "lead-zeitplan-b3"],
    },
    {
      id: "teil-brandschutztuer-t30",
      category: "neues_teil",
      title: "Brandschutztuer T30-L",
      location: "Ebene 1, Flur Ost, Achse B3",
      question: "Ist das richtige neue Teil eingebaut?",
      expected: "Soll: T30-L Brandschutztuer laut Plan P-231",
      recognized: "Recognition: T90-RS Tuerblatt erkannt, 79% sicher",
      confidence: 79,
      scannerFrame: "Frame 12:24:12, Kamera Worker-03",
      backendPrimitive: "installed_component",
      planComparison: "Planvergleich: anderes Tuerblatt als geplant",
      errorOptions: [
        "Falsches Teil eingebaut",
        "Einbauort falsch",
        "Beschriftung unlesbar",
        "Planstand unklar",
      ],
      negativeInputLabel: "Welches falsche Teil ist eingebaut?",
      negativePlaceholder: "z.B. T90-RS statt T30-L",
      defaultNegativeValue: "T90-RS statt T30-L",
      escalationIds: ["lead-falsches-teil-tuer", "lead-planfreigabe-tuer"],
    },
    {
      id: "teil-fenster-f214",
      category: "neues_teil",
      title: "Fensterelement F2.14",
      location: "Ebene 2, Fassade Sued",
      question: "Ist das Fensterelement vollstaendig eingebaut?",
      expected: "Soll: Rahmen und Verglasung F2.14 montiert",
      recognized: "Recognition: Rahmen erkannt, Verglasung fehlt, 73% sicher",
      confidence: 73,
      scannerFrame: "Frame 12:26:31, Kamera Worker-01",
      backendPrimitive: "installed_component",
      planComparison: "Planvergleich: Teilmontage blockiert Abdichtung",
      errorOptions: [
        "Teil fehlt",
        "Teil nur teilweise eingebaut",
        "Falsches Bauteil",
        "Bild unscharf",
      ],
      negativeInputLabel: "Was ist falsch oder unvollstaendig?",
      negativePlaceholder: "z.B. Verglasung fehlt",
      defaultNegativeValue: "Verglasung fehlt",
      escalationIds: ["lead-zeitplan-b3"],
    },
    {
      id: "planwechsel-tuer-t05",
      category: "planaenderung",
      title: "Planwechsel Tuer T-05",
      location: "Ebene 1, Flur Ost",
      question: "Ist die Planaenderung vor Ort umgesetzt?",
      expected: "Soll: Tuer T-05 ersetzt T-04 nach Planrevision R7",
      recognized: "Recognition: altes T-04 Element liegt vor Ort, 82% sicher",
      confidence: 82,
      scannerFrame: "Frame 12:28:03, Kamera Worker-03",
      backendPrimitive: "plan_revision_match",
      planComparison: "Planvergleich: Montageteam arbeitet mit altem Planstand",
      errorOptions: [
        "Planstand alt",
        "Falsches Teil vorbereitet",
        "Freigabe fehlt",
        "Rueckfrage Planung",
      ],
      negativeInputLabel: "Was muss zur Planaenderung korrigiert werden?",
      negativePlaceholder: "z.B. T-05 statt T-04 bestellen und Plan R7 verteilen",
      defaultNegativeValue: "T-05 statt T-04 bestellen und Plan R7 verteilen",
      escalationIds: ["lead-planfreigabe-tuer", "lead-zeitplan-b3"],
    },
  ]

export const BAULEITER_ESCALATIONS: LeadEscalation[] = [
  {
    id: "lead-nachbestellung-material",
    type: "nachbestellung",
    severity: "kritisch",
    title: "Material nachbestellen",
    status: "Entscheidung offen",
    location: "Lager Nord und Fundamentstreifen C",
    sourceTaskIds: ["bestand-stahl-b500b", "bestand-beton-c3037"],
    problem: "Stahl und Beton liegen unter Sollbestand.",
    evidence: "Worker-App bestaetigt 4/6 Paletten Stahl und 28/38 t Beton.",
    impact: "Betonierabschnitt B3 kann heute nur teilweise laufen.",
    owner: "Einkauf + Bauleitung",
    due: "heute 13:30",
    recommendation:
      "2 Paletten B500B und 10 t C30/37 als Express-Nachbestellung ausloesen.",
    metrics: [
      { label: "Fehlmenge Stahl", value: "2 Pal." },
      { label: "Fehlmenge Beton", value: "10 t" },
      { label: "Kostenrisiko", value: "18.400 EUR" },
    ],
  },
  {
    id: "lead-falsches-teil-tuer",
    type: "falsches_teil",
    severity: "kritisch",
    title: "Falsches Tuerblatt eingebaut",
    status: "Rueckbau pruefen",
    location: "Ebene 1, Flur Ost, Achse B3",
    sourceTaskIds: ["teil-brandschutztuer-t30"],
    problem: "Erkanntes Tuerblatt passt nicht zur Planposition.",
    evidence:
      "Recognition klassifiziert T90-RS statt T30-L, Worker soll bestaetigen.",
    impact: "Abnahme Brandschutz und Ausbaufolge sind blockiert.",
    owner: "Bauleitung Ausbau",
    due: "heute 15:00",
    recommendation:
      "Planstand klaeren, Lieferschein pruefen und Montagekolonne stoppen.",
    metrics: [
      { label: "Konfidenz", value: "79%" },
      { label: "Gewerk", value: "Ausbau" },
      { label: "Rueckbau", value: "wahrscheinlich" },
    ],
  },
  {
    id: "lead-zeitplan-b3",
    type: "zeitplan",
    severity: "warnung",
    title: "Bau laeuft langsamer als geplant",
    status: "Terminrisiko",
    location: "Abschnitt B3 und Fassade Sued",
    sourceTaskIds: [
      "bestand-stahl-b500b",
      "bestand-beton-c3037",
      "teil-fenster-f214",
      "planwechsel-tuer-t05",
    ],
    problem: "Mehrere Primitive blockieren denselben Ablaufpfad.",
    evidence:
      "Material fehlt, Fensterelement ist unvollstaendig, Planwechsel ist nicht umgesetzt.",
    impact:
      "Prognose: 2.5 Tage Verzug, wenn Nachbestellung heute nicht bestaetigt wird.",
    owner: "Bauleiter Gesamtkoordination",
    due: "heute 16:00",
    recommendation:
      "Betonierfolge neu takten, Ausbau B3 priorisieren und Fensterabdichtung separat planen.",
    metrics: [
      { label: "Zeitwirkung", value: "+2.5 d" },
      { label: "Betroffene Gewerke", value: "3" },
      { label: "Offene Worker Checks", value: "5" },
    ],
  },
  {
    id: "lead-planfreigabe-tuer",
    type: "planfreigabe",
    severity: "warnung",
    title: "Planrevision R7 nicht auf Baustelle",
    status: "Planung anfragen",
    location: "Ebene 1, Flur Ost",
    sourceTaskIds: ["teil-brandschutztuer-t30", "planwechsel-tuer-t05"],
    problem: "Vor Ort taucht ein alter Tuerstand auf.",
    evidence:
      "Scanner erkennt T-04/T90-RS, Soll ist T-05/T30-L nach Revision R7.",
    impact:
      "Falsche Bestellung oder falscher Einbau kann Kosten und Rueckbau ausloesen.",
    owner: "Planung + Bauleitung",
    due: "heute 14:15",
    recommendation:
      "Revision R7 an Kolonne pushen und Einkauf gegen aktuelle Tuerliste pruefen.",
    metrics: [
      { label: "Planrevision", value: "R7" },
      { label: "Konflikte", value: "2" },
      { label: "Kostenrisiko", value: "6.200 EUR" },
    ],
  },
]
