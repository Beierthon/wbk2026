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
    label: "Inventory",
    shortLabel: "Inventory XY",
  },
  neues_teil: {
    label: "New part",
    shortLabel: "Part installed",
  },
  planaenderung: {
    label: "Plan change",
    shortLabel: "Plan update",
  },
}

export const RECOGNITION_PIPELINE = [
  "Phone camera",
  "Scanner website",
  "Frames to backend",
  "Primitive Recognition",
  "Plan comparison",
  "Error list",
  "Live dashboard + worker app",
] as const

export const PRIMITIVE_RECOGNITION_CLASSIFICATIONS: PrimitiveRecognitionClassification[] =
  [
    {
      id: "bestand-stahl-b500b",
      category: "bestand",
      title: "B500B steel inventory",
      location: "North storage zone",
      question: "Is the B500B steel inventory correct?",
      expected: "Expected: 6 pallets B500B for axis B3",
      recognized: "Recognition: 4 pallets B500B, 84% confidence",
      confidence: 84,
      scannerFrame: "Frame 12:21:08, camera Worker-02",
      backendPrimitive: "material_inventory",
      planComparison: "Plan comparison: 2 pallets missing for formwork B3",
      errorOptions: [
        "Quantity wrong",
        "Material missing",
        "Wrong location",
        "Image blurred",
      ],
      negativeInputLabel: "How much is actually there?",
      negativePlaceholder: "e.g. 4 pallets",
      defaultNegativeValue: "4 pallets",
      escalationIds: ["lead-nachbestellung-material", "lead-zeitplan-b3"],
    },
    {
      id: "bestand-beton-c3037",
      category: "bestand",
      title: "Concrete C30/37 inventory",
      location: "Strip foundation C, west silo",
      question: "Is the concrete C30/37 inventory correct?",
      expected: "Expected: 38 t concrete C30/37 by 14:00",
      recognized: "Recognition: 28 t visible, 91% confidence",
      confidence: 91,
      scannerFrame: "Frame 12:22:44, camera Worker-02",
      backendPrimitive: "material_inventory",
      planComparison:
        "Plan comparison: 10 t missing for today's concrete section",
      errorOptions: [
        "Quantity wrong",
        "Delivery missing",
        "Material mixed up",
        "Already installed",
      ],
      negativeInputLabel: "How much is actually there?",
      negativePlaceholder: "e.g. 28 t",
      defaultNegativeValue: "28 t",
      escalationIds: ["lead-nachbestellung-material", "lead-zeitplan-b3"],
    },
    {
      id: "teil-brandschutztuer-t30",
      category: "neues_teil",
      title: "T30-L fire door",
      location: "Level 1, east corridor, axis B3",
      question: "Is the correct new part installed?",
      expected: "Expected: T30-L fire door according to plan P-231",
      recognized: "Recognition: T90-RS door leaf detected, 79% confidence",
      confidence: 79,
      scannerFrame: "Frame 12:24:12, camera Worker-03",
      backendPrimitive: "installed_component",
      planComparison: "Plan comparison: different door leaf than planned",
      errorOptions: [
        "Wrong part installed",
        "Wrong installation location",
        "Label unreadable",
        "Plan version unclear",
      ],
      negativeInputLabel: "Which wrong part is installed?",
      negativePlaceholder: "e.g. T90-RS instead of T30-L",
      defaultNegativeValue: "T90-RS instead of T30-L",
      escalationIds: ["lead-falsches-teil-tuer", "lead-planfreigabe-tuer"],
    },
    {
      id: "teil-fenster-f214",
      category: "neues_teil",
      title: "Window element F2.14",
      location: "Level 2, south facade",
      question: "Is the window element fully installed?",
      expected: "Expected: frame and glazing F2.14 installed",
      recognized:
        "Recognition: frame detected, glazing missing, 73% confidence",
      confidence: 73,
      scannerFrame: "Frame 12:26:31, camera Worker-01",
      backendPrimitive: "installed_component",
      planComparison: "Plan comparison: partial installation blocks sealing",
      errorOptions: [
        "Part missing",
        "Part only partly installed",
        "Wrong component",
        "Image blurred",
      ],
      negativeInputLabel: "What is wrong or incomplete?",
      negativePlaceholder: "e.g. glazing missing",
      defaultNegativeValue: "glazing missing",
      escalationIds: ["lead-zeitplan-b3"],
    },
    {
      id: "planwechsel-tuer-t05",
      category: "planaenderung",
      title: "Door T-05 plan change",
      location: "Level 1, east corridor",
      question: "Has the plan change been implemented on site?",
      expected: "Expected: door T-05 replaces T-04 after plan revision R7",
      recognized: "Recognition: old T-04 element on site, 82% confidence",
      confidence: 82,
      scannerFrame: "Frame 12:28:03, camera Worker-03",
      backendPrimitive: "plan_revision_match",
      planComparison:
        "Plan comparison: assembly team is working from an old plan version",
      errorOptions: [
        "Old plan version",
        "Wrong part prepared",
        "Approval missing",
        "Planning question",
      ],
      negativeInputLabel: "What must be corrected for the plan change?",
      negativePlaceholder:
        "e.g. order T-05 instead of T-04 and distribute plan R7",
      defaultNegativeValue: "order T-05 instead of T-04 and distribute plan R7",
      escalationIds: ["lead-planfreigabe-tuer", "lead-zeitplan-b3"],
    },
  ]

export const BAULEITER_ESCALATIONS: LeadEscalation[] = [
  {
    id: "lead-nachbestellung-material",
    type: "nachbestellung",
    severity: "kritisch",
    title: "Reorder material",
    status: "Decision open",
    location: "North storage and strip foundation C",
    sourceTaskIds: ["bestand-stahl-b500b", "bestand-beton-c3037"],
    problem: "Steel and concrete are below expected stock.",
    evidence: "Worker app confirms 4/6 steel pallets and 28/38 t concrete.",
    impact: "Concrete section B3 can only run partially today.",
    owner: "Procurement + site management",
    due: "today 13:30",
    recommendation:
      "Trigger an express reorder for 2 pallets B500B and 10 t C30/37.",
    metrics: [
      { label: "Steel shortfall", value: "2 pallets" },
      { label: "Concrete shortfall", value: "10 t" },
      { label: "Cost risk", value: "18,400 EUR" },
    ],
  },
  {
    id: "lead-falsches-teil-tuer",
    type: "falsches_teil",
    severity: "kritisch",
    title: "Wrong door leaf installed",
    status: "Check removal",
    location: "Level 1, east corridor, axis B3",
    sourceTaskIds: ["teil-brandschutztuer-t30"],
    problem: "Detected door leaf does not match the plan position.",
    evidence:
      "Recognition classifies T90-RS instead of T30-L; worker should confirm.",
    impact: "Fire-safety acceptance and interior sequence are blocked.",
    owner: "Interior site management",
    due: "today 15:00",
    recommendation:
      "Clarify plan version, check delivery note, and stop the installation crew.",
    metrics: [
      { label: "Confidence", value: "79%" },
      { label: "Trade", value: "Interior" },
      { label: "Removal", value: "likely" },
    ],
  },
  {
    id: "lead-zeitplan-b3",
    type: "zeitplan",
    severity: "warnung",
    title: "Construction is slower than planned",
    status: "Schedule risk",
    location: "Section B3 and south facade",
    sourceTaskIds: [
      "bestand-stahl-b500b",
      "bestand-beton-c3037",
      "teil-fenster-f214",
      "planwechsel-tuer-t05",
    ],
    problem: "Several primitives block the same workflow path.",
    evidence:
      "Material is missing, the window element is incomplete, and the plan change is not implemented.",
    impact: "Forecast: 2.5 days delay if the reorder is not confirmed today.",
    owner: "Overall site coordination",
    due: "today 16:00",
    recommendation:
      "Retakt the concrete sequence, prioritize interior work B3, and plan window sealing separately.",
    metrics: [
      { label: "Schedule impact", value: "+2.5 d" },
      { label: "Affected trades", value: "3" },
      { label: "Open worker checks", value: "5" },
    ],
  },
  {
    id: "lead-planfreigabe-tuer",
    type: "planfreigabe",
    severity: "warnung",
    title: "Plan revision R7 not on site",
    status: "Ask planning",
    location: "Level 1, east corridor",
    sourceTaskIds: ["teil-brandschutztuer-t30", "planwechsel-tuer-t05"],
    problem: "An old door version appears on site.",
    evidence:
      "Scanner detects T-04/T90-RS; expected is T-05/T30-L after revision R7.",
    impact:
      "Wrong ordering or installation can trigger costs and removal work.",
    owner: "Planning + site management",
    due: "today 14:15",
    recommendation:
      "Push revision R7 to the crew and check procurement against the current door list.",
    metrics: [
      { label: "Planrevision", value: "R7" },
      { label: "Conflicts", value: "2" },
      { label: "Cost risk", value: "6,200 EUR" },
    ],
  },
]
