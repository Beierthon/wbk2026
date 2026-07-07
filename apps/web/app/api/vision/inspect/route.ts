import { NextResponse } from "next/server"

interface ExpectedVisionItem {
  id: string
  name: string
  einheit: string
  geliefert: number
  verbaut: number
  verbleibend: number
  externeReferenz?: string
}

interface VisionInspectRequest {
  image?: string
  expectedItems?: ExpectedVisionItem[]
}

interface DetectionBox {
  x: number
  y: number
  width: number
  height: number
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

export async function POST(request: Request) {
  const body = (await request.json()) as VisionInspectRequest
  const expectedItems = (body.expectedItems ?? []).slice(0, 5)
  const seed = hashSeed(
    `${body.image?.slice(0, 320) ?? "demo"}:${expectedItems
      .map((item) => item.id)
      .join("|")}`
  )

  const detections = expectedItems.map((item, index) => {
    const confidence = 0.72 + seededFraction(seed, index + 20) * 0.22
    const observedDelta = index === 0 ? 4 : Math.round(seededFraction(seed, index + 30) * 2)
    const interpretedVerbaut = Math.min(
      item.geliefert,
      item.verbaut + observedDelta
    )

    return {
      id: `vision-${item.id}`,
      materialId: item.id,
      label: item.name,
      confidence: Number(confidence.toFixed(2)),
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
    }
  })

  return NextResponse.json({
    capturedAt: new Date().toISOString(),
    frameRate: 1,
    source: "mock-vision-backend",
    summary: {
      expected: expectedItems.length,
      detected: detections.length,
      matched: detections.filter((detection) => detection.confidence >= 0.75)
        .length,
      needsConfirmation: true,
    },
    detections,
  })
}
