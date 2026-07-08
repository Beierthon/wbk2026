import type { LagerArtikel } from "@workspace/domain"

import type { ExpectedVisionItem, VisionDetection } from "./types"
import type { VisionStreamDetection } from "./stream-types"

export type VisionInventoryProposalStatus = "proposal" | "unchanged" | "ignored"

export interface VisionInventoryProposal {
  artikelId: string
  artikelName: string
  detectedCount: number
  currentStock: number
  confidence: number
  capturedAt: string
  frameCount: number
  status: VisionInventoryProposalStatus
}

export interface VisionInventoryCountingConfig {
  stableWindowMs: number
  minFrames: number
  minConfidence: number
  maxMissedFrames: number
  promptCooldownMs: number
}

interface StableTrack {
  count: number
  firstSeenAt: number
  lastSeenAt: number
  frameCount: number
  confidenceTotal: number
  missedFrames: number
}

const DEFAULT_CONFIG: VisionInventoryCountingConfig = {
  stableWindowMs: 1500,
  minFrames: 3,
  minConfidence: 0.55,
  maxMissedFrames: 1,
  promptCooldownMs: 10000,
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function singularize(value: string) {
  return value
    .replace(/\baepfel\b/g, "apfel")
    .replace(/\bapple\b/g, "apfel")
    .replace(/\bapples\b/g, "apfel")
    .replace(/\bbanana\b/g, "banane")
    .replace(/\bbananen\b/g, "banane")
    .replace(/\bbananas\b/g, "banane")
    .replace(/\borangen\b/g, "orange")
    .replace(/\boranges\b/g, "orange")
}

function normalizedTokens(value: string) {
  return singularize(normalize(value)).split(" ").filter(Boolean)
}

export function buildExpectedItemsFromLagerArtikel(
  artikel: LagerArtikel[]
): ExpectedVisionItem[] {
  return artikel.map((item) => ({
    id: item.id,
    name: item.name,
    einheit: "stueck",
    geliefert: item.maximal,
    verbaut: Math.max(0, item.maximal - item.aktuell),
    verbleibend: item.aktuell,
  }))
}

export function matchInventoryDetection(
  detection:
    | Pick<VisionDetection, "materialId" | "label">
    | VisionStreamDetection,
  artikel: LagerArtikel[]
): LagerArtikel | null {
  const materialId =
    "materialId" in detection ? detection.materialId : undefined
  if (materialId) {
    const byId = artikel.find((item) => item.id === materialId)
    if (byId) {
      return byId
    }
  }

  const detectionTokens = normalizedTokens(
    [
      materialId,
      detection.label,
      "cocoClass" in detection ? detection.cocoClass : "",
    ]
      .filter(Boolean)
      .join(" ")
  )

  if (detectionTokens.length === 0) {
    return null
  }

  return (
    artikel.find((item) => {
      const itemTokens = normalizedTokens(`${item.id} ${item.name}`)
      return detectionTokens.some((token) => itemTokens.includes(token))
    }) ?? null
  )
}

function detectionConfidence(
  detection: Pick<VisionDetection, "confidence"> | VisionStreamDetection
) {
  return Number.isFinite(detection.confidence) ? detection.confidence : 0
}

export class VisionInventoryCounter {
  private readonly config: VisionInventoryCountingConfig
  private readonly tracks = new Map<string, StableTrack>()
  private readonly emittedAt = new Map<string, number>()

  constructor(config: Partial<VisionInventoryCountingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  observe(input: {
    artikel: LagerArtikel[]
    detections: (VisionDetection | VisionStreamDetection)[]
    capturedAt?: string
    now?: number
  }): VisionInventoryProposal | null {
    const now = input.now ?? Date.now()
    const capturedAt = input.capturedAt ?? new Date(now).toISOString()
    const counts = new Map<
      string,
      { artikel: LagerArtikel; count: number; confidenceTotal: number }
    >()

    for (const detection of input.detections) {
      if (detectionConfidence(detection) < this.config.minConfidence) {
        continue
      }

      const item = matchInventoryDetection(detection, input.artikel)
      if (!item) {
        continue
      }

      const current = counts.get(item.id)
      if (current) {
        current.count += 1
        current.confidenceTotal += detectionConfidence(detection)
      } else {
        counts.set(item.id, {
          artikel: item,
          count: 1,
          confidenceTotal: detectionConfidence(detection),
        })
      }
    }

    for (const artikelId of this.tracks.keys()) {
      if (!counts.has(artikelId)) {
        const current = this.tracks.get(artikelId)
        if (!current) {
          continue
        }

        current.missedFrames += 1
        if (current.missedFrames > this.config.maxMissedFrames) {
          this.tracks.delete(artikelId)
        }
      }
    }

    let proposal: VisionInventoryProposal | null = null

    for (const [artikelId, observed] of counts) {
      const current = this.tracks.get(artikelId)
      const averageConfidence = observed.confidenceTotal / observed.count

      if (!current || current.count !== observed.count) {
        this.tracks.set(artikelId, {
          count: observed.count,
          firstSeenAt: now,
          lastSeenAt: now,
          frameCount: 1,
          confidenceTotal: averageConfidence,
          missedFrames: 0,
        })
        continue
      }

      current.lastSeenAt = now
      current.frameCount += 1
      current.confidenceTotal += averageConfidence
      current.missedFrames = 0

      const stableFor = current.lastSeenAt - current.firstSeenAt
      if (
        stableFor < this.config.stableWindowMs ||
        current.frameCount < this.config.minFrames
      ) {
        continue
      }

      const emitKey = `${artikelId}:${current.count}`
      const lastEmittedAt = this.emittedAt.get(emitKey)
      if (
        lastEmittedAt !== undefined &&
        now - lastEmittedAt < this.config.promptCooldownMs
      ) {
        continue
      }

      this.emittedAt.set(emitKey, now)
      proposal = {
        artikelId,
        artikelName: observed.artikel.name,
        detectedCount: current.count,
        currentStock: observed.artikel.aktuell,
        confidence: Number(
          (current.confidenceTotal / current.frameCount).toFixed(2)
        ),
        capturedAt,
        frameCount: current.frameCount,
        status:
          current.count === observed.artikel.aktuell ? "unchanged" : "proposal",
      }
      break
    }

    return proposal
  }
}
