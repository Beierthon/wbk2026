import { analyzeImageWithMock } from "./mock-analyzer"
import { analyzeImageWithOpenAI } from "./openai-analyzer"
import type { VisionInspectRequest, VisionInspectResponse } from "./types"

export async function analyzeVisionImage(
  request: VisionInspectRequest
): Promise<VisionInspectResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  const mode = process.env.WBK_VISION_MODE ?? "mock"

  if (mode !== "openai" || !apiKey) {
    return analyzeImageWithMock(request)
  }

  try {
    return await analyzeImageWithOpenAI(request, apiKey)
  } catch (error) {
    if (process.env.WBK_VISION_FALLBACK_TO_MOCK === "false") {
      throw error
    }

    return analyzeImageWithMock(request)
  }
}

export type {
  ExpectedVisionItem,
  VisionDetection,
  VisionInspectRequest,
  VisionInspectResponse,
} from "./types"
