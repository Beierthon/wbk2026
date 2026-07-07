import OpenAI from "openai"
import { z } from "zod"

import type { AnalyzeRequest, AnalyzeResponse, VisionAnalyzer } from "./types"

const OpenAIOutputSchema = z.object({
  estimate: z.number(),
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
})

export const openaiAnalyzer: VisionAnalyzer = {
  name: "openai",
  async analyze(req: AnalyzeRequest): Promise<AnalyzeResponse> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY nicht gesetzt.")
    }

    const client = new OpenAI({ apiKey })
    const model = process.env.OPENAI_MODEL || "gpt-4o"

    const systemPrompt = req.mode === "fortschritt"
      ? [
          "Du bist eine Bau-Sichtprüfung.",
          "Bewerte den Baufortschritt der genannten Position anhand des Bildes.",
          "Antwortformat: ausschließlich JSON mit den Feldern estimate (Zahl 0-100 für Prozent), confidence (0-1), interpretation (kurz, deutsch), optional boundingBoxes.",
        ].join(" ")
      : [
          "Du bist eine Bau-Bestandserfassung.",
          "Zähle bzw. schätze die Menge der genannten Position auf dem Bild.",
          "Antwortformat: ausschließlich JSON mit den Feldern estimate (Zahl in der angegebenen Einheit), confidence (0-1), interpretation (kurz, deutsch), optional boundingBoxes.",
        ].join(" ")

    const userText = [
      `Erwartete Position: ${req.expectedItem.name}`,
      `Einheit: ${req.expectedItem.einheit}`,
      req.expectedItem.sollmenge != null
        ? `Sollmenge zur Orientierung: ${req.expectedItem.sollmenge}`
        : null,
      req.expectedItem.bauabschnitt
        ? `Bauabschnitt: ${req.expectedItem.bauabschnitt}`
        : null,
      req.expectedItem.beschreibung
        ? `Beschreibung: ${req.expectedItem.beschreibung}`
        : null,
      "Bitte ausschließlich das JSON zurückgeben, keine Markdown-Codefences.",
    ]
      .filter(Boolean)
      .join("\n")

    const response = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: req.image } },
          ],
        },
      ],
    })

    const content = response.choices[0]?.message?.content ?? "{}"
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new Error("OpenAI-Antwort konnte nicht als JSON gelesen werden.")
    }
    const output = OpenAIOutputSchema.parse(parsed)

    return {
      mode: "openai",
      estimate: output.estimate,
      einheit: req.mode === "fortschritt" ? "prozent" : req.expectedItem.einheit,
      confidence: output.confidence,
      interpretation: output.interpretation,
      boundingBoxes: output.boundingBoxes,
      raw: {
        source: "openai",
        model,
        usage: response.usage,
        content,
      },
    }
  },
}
