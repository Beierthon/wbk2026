import { z } from "zod"

import { EINHEITEN } from "@/lib/domain/schemas"

export const AnalyzeRequestSchema = z.object({
  image: z.string(),
  mode: z.enum(["bestand", "fortschritt", "freitext"]),
  expectedItem: z.object({
    name: z.string(),
    einheit: z.enum(EINHEITEN),
    sollmenge: z.number().optional(),
    beschreibung: z.string().optional(),
    bauabschnitt: z.string().optional(),
  }),
  visionMode: z.enum(["mock", "openai"]).optional(),
})
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>

export const AnalyzeResponseSchema = z.object({
  mode: z.enum(["mock", "openai"]),
  estimate: z.number(),
  einheit: z.string(),
  confidence: z.number().min(0).max(1),
  interpretation: z.string(),
  boundingBoxes: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
        label: z.string(),
      }),
    )
    .optional(),
  raw: z.unknown().optional(),
})
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>

export interface VisionAnalyzer {
  name: "mock" | "openai"
  analyze(request: AnalyzeRequest): Promise<AnalyzeResponse>
}
