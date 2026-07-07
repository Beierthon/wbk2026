import type {
  DetectionBox,
  ExpectedVisionItem,
  VisionDetection,
  VisionInspectRequest,
  VisionInspectResponse,
  VisionInspectionMode,
} from "./types"

const STABLE_MOCK_BOXES: Record<string, DetectionBox> = {
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

function createBox(seed: number, index: number): DetectionBox {
  return {
    x: Math.round(6 + seededFraction(seed, index + 1) * 58),
    y: Math.round(10 + seededFraction(seed, index + 2) * 46),
    width: Math.round(18 + seededFraction(seed, index + 3) * 18),
    height: Math.round(14 + seededFraction(seed, index + 4) * 18),
  }
}

function pickExpectedItems(
  expectedItems: ExpectedVisionItem[],
  mode: VisionInspectionMode,
  focusMaterialId?: string
) {
  if (mode === "detail" && focusMaterialId) {
    return expectedItems.filter((item) => item.id === focusMaterialId).slice(0, 1)
  }

  return expectedItems.slice(0, 5)
}

export function analyzeImageWithMock(
  request: VisionInspectRequest
): VisionInspectResponse {
  const mode = request.mode ?? "scan"
  const useStableMock = request.useStableMock ?? !request.image
  const expectedItems = pickExpectedItems(
    request.expectedItems ?? [],
    mode,
    request.focusMaterialId
  )
  const seed = hashSeed(
    `${request.image?.slice(0, 320) ?? "demo"}:${mode}:${expectedItems
      .map((item) => item.id)
      .join("|")}`
  )

  const detections: VisionDetection[] = expectedItems.map((item, index) => {
    const stableBox = STABLE_MOCK_BOXES[item.id]
    const confidence =
      useStableMock && STABLE_MOCK_CONFIDENCE[item.id] !== undefined
        ? STABLE_MOCK_CONFIDENCE[item.id]!
        : mode === "detail"
          ? 0.82 + seededFraction(seed, index + 20) * 0.14
          : 0.72 + seededFraction(seed, index + 20) * 0.22
    const observedDelta =
      useStableMock && STABLE_MOCK_VERBAUT_DELTA[item.id] !== undefined
        ? STABLE_MOCK_VERBAUT_DELTA[item.id]!
        : mode === "detail"
          ? 3
          : index === 0
            ? 4
            : Math.round(seededFraction(seed, index + 30) * 2)
    const interpretedVerbaut = Math.min(
      item.geliefert,
      item.verbaut + observedDelta
    )

    return {
      id: `vision-${item.id}`,
      materialId: item.id,
      label: item.name,
      confidence: Number(confidence.toFixed(2)),
      reason:
        mode === "detail"
          ? "Mock-Detailanalyse nach Nutzerfokus mit plausibler Mengenfortschreibung."
          : "Mock-Scan gleicht das Kamerabild gegen erwartete Materialpositionen ab.",
      box:
        useStableMock && stableBox ? stableBox : createBox(seed, index),
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
      detail:
        mode === "detail"
          ? {
              zustand: "augenscheinlich intakt",
              geschaetzteAnzahl: observedDelta,
              sichtbareMaengel: [],
              empfehlung:
                "Als Vorschlag pruefen und erst nach Bestaetigung uebernehmen.",
            }
          : undefined,
    }
  })

  return {
    capturedAt: new Date().toISOString(),
    frameRate: mode === "scan" ? 1 : 1,
    source: useStableMock ? "mock-vision-stable-demo" : "mock-vision-backend",
    mode,
    summary: {
      expected: expectedItems.length,
      detected: detections.length,
      matched: detections.filter((detection) => detection.confidence >= 0.75)
        .length,
      needsConfirmation: true,
      message:
        mode === "detail"
          ? "Detailanalyse vorbereitet. Bitte Vorschlag pruefen."
          : "Moegliche Bauteile erkannt. Bitte Treffer bestaetigen.",
    },
    detections,
  }
}
