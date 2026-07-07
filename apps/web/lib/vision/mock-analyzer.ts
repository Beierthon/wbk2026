import type {
  DetectionBox,
  ExpectedVisionItem,
  VisionDetection,
  VisionInspectRequest,
  VisionInspectResponse,
  VisionInspectionMode,
} from "./types"

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
    return expectedItems
      .filter((item) => item.id === focusMaterialId)
      .slice(0, 1)
  }

  return expectedItems.slice(0, 5)
}

export function analyzeImageWithMock(
  request: VisionInspectRequest
): VisionInspectResponse {
  const mode = request.mode ?? "scan"
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
    const confidence =
      mode === "detail"
        ? 0.82 + seededFraction(seed, index + 20) * 0.14
        : 0.72 + seededFraction(seed, index + 20) * 0.22
    const observedDelta =
      mode === "detail"
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
          ? "Mock detail analysis after user focus with plausible quantity update."
          : "Mock scan compares the camera image against expected material positions.",
      box: createBox(seed, index),
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
              zustand: "visually intact",
              geschaetzteAnzahl: observedDelta,
              sichtbareMaengel: [],
              empfehlung:
                "Review as a suggestion and apply only after confirmation.",
            }
          : undefined,
    }
  })

  return {
    capturedAt: new Date().toISOString(),
    frameRate: mode === "scan" ? 0.25 : 1,
    source: "mock-vision-backend",
    mode,
    summary: {
      expected: expectedItems.length,
      detected: detections.length,
      matched: detections.filter((detection) => detection.confidence >= 0.75)
        .length,
      needsConfirmation: true,
      message:
        mode === "detail"
          ? "Detail analysis ready. Please review the suggestion."
          : "Possible building elements detected. Please confirm matches.",
    },
    detections,
  }
}
