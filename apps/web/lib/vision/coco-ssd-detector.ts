import type { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd"

import type {
  DetectionBox,
  ExpectedVisionItem,
  VisionDetection,
  VisionInspectResponse,
} from "./types"

export const COCO_SSD_SOURCE = "coco-ssd-browser-detector" as const

const DETECTION_THRESHOLD = 0.45
const MAX_DETECTIONS = 12

const COCO_GERMAN_LABELS: Record<string, string> = {
  chair: "Stuhl",
  couch: "Sofa",
  bed: "Bett",
  "dining table": "Esstisch",
  toilet: "Toilette",
  tv: "Fernseher",
  laptop: "Laptop",
  mouse: "Maus",
  keyboard: "Tastatur",
  "cell phone": "Handy",
  book: "Buch",
  bottle: "Flasche",
  cup: "Tasse",
  bowl: "Schuessel",
  person: "Person",
  car: "Auto",
  truck: "LKW",
  bus: "Bus",
  bicycle: "Fahrrad",
  "potted plant": "Topfpflanze",
  suitcase: "Koffer",
  backpack: "Rucksack",
  handbag: "Handtasche",
}

const COCO_TO_MATERIAL_KEYWORDS: Record<string, string[]> = {
  chair: ["stuhl", "chair", "sitz"],
  couch: ["sofa", "couch"],
  bed: ["bett"],
  "dining table": ["tisch", "table"],
  person: ["person", "arbeiter"],
  car: ["fahrzeug", "auto"],
  truck: ["lkw", "lastwagen"],
}

let cachedModel: ObjectDetection | null = null
let modelLoadPromise: Promise<ObjectDetection | null> | null = null

export type CocoModelStatus = "idle" | "loading" | "ready" | "failed"

export function boxFromCocoDetection(
  detection: DetectedObject,
  width: number,
  height: number
): DetectionBox {
  const [x, y, boxWidth, boxHeight] = detection.bbox

  return {
    x: Math.max(0, Math.round((x / width) * 100)),
    y: Math.max(0, Math.round((y / height) * 100)),
    width: Math.min(100, Math.round((boxWidth / width) * 100)),
    height: Math.min(100, Math.round((boxHeight / height) * 100)),
  }
}

function getGermanLabel(cocoClass: string) {
  return COCO_GERMAN_LABELS[cocoClass] ?? cocoClass
}

function findMatchingMaterial(
  cocoClass: string,
  expectedItems: ExpectedVisionItem[]
) {
  const keywords = COCO_TO_MATERIAL_KEYWORDS[cocoClass] ?? [cocoClass]

  return expectedItems.find((item) => {
    const normalizedName = item.name.toLowerCase()
    const normalizedId = item.id.toLowerCase()

    return keywords.some(
      (keyword) =>
        normalizedName.includes(keyword) || normalizedId.includes(keyword)
    )
  })
}

function buildVisionDetectionFromCoco(
  detection: DetectedObject,
  index: number,
  box: DetectionBox,
  expectedItems: ExpectedVisionItem[]
): VisionDetection {
  const cocoClass = detection.class
  const germanLabel = getGermanLabel(cocoClass)
  const matchedMaterial = findMatchingMaterial(cocoClass, expectedItems)
  const materialId = matchedMaterial?.id ?? `coco-${cocoClass.replace(/\s+/g, "-")}`
  const label = matchedMaterial?.name ?? germanLabel
  const interpretedVerbaut = matchedMaterial
    ? Math.min(matchedMaterial.geliefert, matchedMaterial.verbaut + 1)
    : 1

  return {
    id: `coco-${cocoClass.replace(/\s+/g, "-")}-${index + 1}`,
    materialId,
    label,
    confidence: Number(detection.score.toFixed(2)),
    reason: `COCO-SSD Browser-Erkennung: ${germanLabel} (${Math.round(detection.score * 100)}% Konfidenz).`,
    box,
    systemMatch: {
      materialName: label,
      externeReferenz: matchedMaterial?.externeReferenz,
    },
    interpreted: {
      geliefert: matchedMaterial?.geliefert ?? 0,
      verbaut: interpretedVerbaut,
      verbleibend: matchedMaterial
        ? Math.max(0, matchedMaterial.geliefert - interpretedVerbaut)
        : 0,
      einheit: matchedMaterial?.einheit ?? "stueck",
    },
  }
}

function buildSummaryMessage(
  detections: VisionDetection[],
  rawDetections: DetectedObject[]
) {
  if (detections.length === 0) {
    return "Keine Objekte erkannt. Kamera auf Gegenstaende richten oder ein anderes Bild testen."
  }

  const chairCount = rawDetections.filter(
    (detection) => detection.class === "chair"
  ).length

  if (chairCount > 0) {
    const otherCount = detections.length - chairCount

    if (otherCount > 0) {
      return `${chairCount} Stuhl${chairCount === 1 ? "" : "e"} und ${otherCount} weitere Objekte erkannt. Bitte pruefen und bestaetigen.`
    }

    return `${chairCount} Stuhl${chairCount === 1 ? "" : "e"} erkannt. Bitte Treffer bestaetigen.`
  }

  return `${detections.length} Objekt${detections.length === 1 ? "" : "e"} erkannt. Bitte Treffer bestaetigen.`
}

export async function loadCocoSsdModel(): Promise<ObjectDetection | null> {
  if (cachedModel) {
    return cachedModel
  }

  if (modelLoadPromise) {
    return modelLoadPromise
  }

  modelLoadPromise = (async () => {
    try {
      const [tf, cocoSsd] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("@tensorflow-models/coco-ssd"),
      ])

      await tf.ready()

      const model = await cocoSsd.load({
        base: "lite_mobilenet_v2",
      })

      cachedModel = model

      return model
    } catch {
      return null
    }
  })()

  return modelLoadPromise
}

export async function detectWithCocoSsd(
  source: HTMLVideoElement | HTMLImageElement,
  expectedItems: ExpectedVisionItem[]
): Promise<VisionInspectResponse | null> {
  const model = await loadCocoSsdModel()

  if (!model) {
    return null
  }

  const width =
    source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth
  const height =
    source instanceof HTMLVideoElement
      ? source.videoHeight
      : source.naturalHeight

  if (!width || !height) {
    return null
  }

  const rawDetections = await model.detect(
    source,
    MAX_DETECTIONS,
    DETECTION_THRESHOLD
  )
  const sortedDetections = [...rawDetections].sort(
    (left, right) => right.score - left.score
  )
  const detections = sortedDetections.map((detection, index) =>
    buildVisionDetectionFromCoco(
      detection,
      index,
      boxFromCocoDetection(detection, width, height),
      expectedItems
    )
  )

  return {
    capturedAt: new Date().toISOString(),
    frameRate: 1,
    source: COCO_SSD_SOURCE,
    mode: "scan",
    summary: {
      expected: expectedItems.length,
      detected: detections.length,
      matched: detections.filter((detection) => detection.confidence >= 0.75)
        .length,
      needsConfirmation: true,
      message: buildSummaryMessage(detections, rawDetections),
    },
    detections,
  }
}

export async function detectFromImageDataUrl(
  dataUrl: string,
  expectedItems: ExpectedVisionItem[]
): Promise<VisionInspectResponse | null> {
  return new Promise((resolve) => {
    const image = new Image()

    image.onload = () => {
      void detectWithCocoSsd(image, expectedItems).then(resolve)
    }

    image.onerror = () => resolve(null)
    image.src = dataUrl
  })
}

export function isCocoSsdSource(source: string | undefined) {
  return source === COCO_SSD_SOURCE
}
