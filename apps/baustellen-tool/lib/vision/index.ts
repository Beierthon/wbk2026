import { mockAnalyzer } from "./mock-analyzer"
import { openaiAnalyzer } from "./openai-analyzer"
import type { AnalyzeRequest, AnalyzeResponse, VisionAnalyzer } from "./types"

export function pickAnalyzer(preferred?: "mock" | "openai"): VisionAnalyzer {
  const mode = preferred ?? (process.env.VISION_MODE as "mock" | "openai" | undefined)
  if (mode === "openai") return openaiAnalyzer
  return mockAnalyzer
}

export async function analyzeImage(
  request: AnalyzeRequest,
): Promise<AnalyzeResponse> {
  const analyzer = pickAnalyzer(request.visionMode)
  return analyzer.analyze(request)
}

export type { AnalyzeRequest, AnalyzeResponse } from "./types"
