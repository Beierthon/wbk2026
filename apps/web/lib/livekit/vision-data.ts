import type { VisionInventoryProposal } from "@/lib/vision/inventory-counting"
import type {
  VisionStreamDetection,
  VisionStreamSummary,
} from "@/lib/vision/stream-types"

export type VisionProposalResolution = "saved" | "dismissed"

export interface VisionStreamDetectionsMessage {
  type?: "detections"
  detections: VisionStreamDetection[]
  summary: VisionStreamSummary
  capturedAt: string
}

export interface VisionStreamProposalsMessage {
  type: "proposals"
  proposalId: string
  proposals: VisionInventoryProposal[]
  capturedAt: string
}

export interface VisionStreamProposalResolutionMessage {
  type: "proposal-resolution"
  proposalId: string
  resolution: VisionProposalResolution
}

export type VisionStreamDataMessage =
  | VisionStreamDetectionsMessage
  | VisionStreamProposalsMessage
  | VisionStreamProposalResolutionMessage

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseDetectionsMessage(
  value: Record<string, unknown>
): VisionStreamDetectionsMessage | null {
  if (value.type !== undefined && value.type !== "detections") {
    return null
  }

  if (
    !Array.isArray(value.detections) ||
    !isRecord(value.summary) ||
    typeof value.capturedAt !== "string"
  ) {
    return null
  }

  return {
    type: value.type === "detections" ? "detections" : undefined,
    detections: value.detections as VisionStreamDetectionsMessage["detections"],
    summary: value.summary as unknown as VisionStreamDetectionsMessage["summary"],
    capturedAt: value.capturedAt,
  }
}

function parseProposalsMessage(
  value: Record<string, unknown>
): VisionStreamProposalsMessage | null {
  if (
    value.type !== "proposals" ||
    typeof value.proposalId !== "string" ||
    !Array.isArray(value.proposals) ||
    typeof value.capturedAt !== "string"
  ) {
    return null
  }

  return {
    type: "proposals",
    proposalId: value.proposalId,
    proposals: value.proposals as VisionStreamProposalsMessage["proposals"],
    capturedAt: value.capturedAt,
  }
}

function parseProposalResolutionMessage(
  value: Record<string, unknown>
): VisionStreamProposalResolutionMessage | null {
  if (
    value.type !== "proposal-resolution" ||
    typeof value.proposalId !== "string" ||
    (value.resolution !== "saved" && value.resolution !== "dismissed")
  ) {
    return null
  }

  return {
    type: "proposal-resolution",
    proposalId: value.proposalId,
    resolution: value.resolution,
  }
}

export function parseVisionStreamDataMessage(
  payload: Uint8Array
): VisionStreamDataMessage | null {
  try {
    const text = new TextDecoder().decode(payload)
    const parsed: unknown = JSON.parse(text)

    if (!isRecord(parsed)) {
      return null
    }

    return (
      parseProposalsMessage(parsed) ??
      parseProposalResolutionMessage(parsed) ??
      parseDetectionsMessage(parsed)
    )
  } catch {
    return null
  }
}

export function serializeVisionStreamDataMessage(
  message: VisionStreamDataMessage
) {
  return new TextEncoder().encode(JSON.stringify(message))
}
