export type VisionMode = "mock" | "live"

export interface VisionDetectionBox {
  x: number
  y: number
  width: number
  height: number
}

export interface VisionExpectedItem {
  id: string
  name: string
  einheit: string
  geliefert: number
  verbaut: number
  verbleibend: number
  externeReferenz?: string
}

export interface VisionDetection {
  id: string
  materialId: string
  label: string
  confidence: number
  box: VisionDetectionBox
  systemMatch: {
    materialName: string
    externeReferenz?: string
  }
  interpreted: {
    geliefert: number
    verbaut: number
    verbleibend: number
    einheit: string
  }
}

export interface VisionInspectResult {
  capturedAt: string
  frameRate: number
  mode: VisionMode
  source: string
  summary: {
    expected: number
    detected: number
    matched: number
    needsConfirmation: boolean
  }
  detections: VisionDetection[]
}

export interface VisionInspectRequest {
  image?: string
  expectedItems?: VisionExpectedItem[]
  useStableMock?: boolean
}

/** Feste Demo-Boxen fuer praesentationsstabile Mock-Erkennung. */
const STABLE_MOCK_BOXES: Record<string, VisionDetectionBox> = {
  "material-drainagevlies": { x: 8, y: 18, width: 34, height: 28 },
  "material-sauberkeitsschicht": { x: 52, y: 42, width: 36, height: 30 },
}

const STABLE_MOCK_CONFIDENCE: Record<string, number> = {
  "material-drainagevlies": 0.91,
  "material-sauberkeitsschicht": 0.87,
}

const STABLE_MOCK_VERBAUT_DELTA: Record<string, number> = {
  "material-drainagevlies": 42,
  "material-sauberkeitsschicht": 4,
}

function hashSeed(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash || 1
}

function seededFraction(seed: number, offset: number) {
  const value = Math.sin(seed + offset) * 10000

  return value - Math.floor(value)
}

function createDynamicBox(seed: number, index: number): VisionDetectionBox {
  return {
    x: Math.round(6 + seededFraction(seed, index + 1) * 58),
    y: Math.round(10 + seededFraction(seed, index + 2) * 46),
    width: Math.round(18 + seededFraction(seed, index + 3) * 18),
    height: Math.round(14 + seededFraction(seed, index + 4) * 18),
  }
}

function buildDetection(
  item: VisionExpectedItem,
  index: number,
  options: { seed: number; useStableMock: boolean }
): VisionDetection {
  const stableBox = STABLE_MOCK_BOXES[item.id]
  const box =
    options.useStableMock && stableBox
      ? stableBox
      : createDynamicBox(options.seed, index)

  const confidence =
    options.useStableMock && STABLE_MOCK_CONFIDENCE[item.id] !== undefined
      ? STABLE_MOCK_CONFIDENCE[item.id]!
      : Number((0.72 + seededFraction(options.seed, index + 20) * 0.22).toFixed(2))

  const observedDelta =
    options.useStableMock && STABLE_MOCK_VERBAUT_DELTA[item.id] !== undefined
      ? STABLE_MOCK_VERBAUT_DELTA[item.id]!
      : index === 0
        ? 4
        : Math.round(seededFraction(options.seed, index + 30) * 2)

  const interpretedVerbaut = Math.min(
    item.geliefert,
    item.verbaut + observedDelta
  )

  return {
    id: `vision-${item.id}`,
    materialId: item.id,
    label: item.name,
    confidence,
    box,
    systemMatch: {
      materialName: item.name,
      externeReferenz: item.externeReferenz,
    },
    interpreted: {
      geliefert: item.geliefert,
      verbaut: interpretedVerbaut,
      verbleibend: Math.max(0, item.geliefert - interpretedVerbaut),
      einheit: item.einheit,
    },
  }
}

export function inspectVisionFrameMock(
  request: VisionInspectRequest
): VisionInspectResult {
  const expectedItems = (request.expectedItems ?? []).slice(0, 5)
  const useStableMock = request.useStableMock ?? true
  const seed = hashSeed(
    `${request.image?.slice(0, 320) ?? "demo"}:${expectedItems
      .map((item) => item.id)
      .join("|")}`
  )

  const detections = expectedItems.map((item, index) =>
    buildDetection(item, index, { seed, useStableMock })
  )

  return {
    capturedAt: new Date().toISOString(),
    frameRate: 1,
    mode: "mock",
    source: useStableMock
      ? "mock-vision-stable-demo"
      : "mock-vision-dynamic-demo",
    summary: {
      expected: expectedItems.length,
      detected: detections.length,
      matched: detections.filter((detection) => detection.confidence >= 0.75)
        .length,
      needsConfirmation: true,
    },
    detections,
  }
}
