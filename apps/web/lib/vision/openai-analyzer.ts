import type {
  DetectionBox,
  ExpectedVisionItem,
  VisionDetection,
  VisionInspectRequest,
  VisionInspectResponse,
  VisionInspectionMode,
} from "./types"

interface OpenAIVisionItem {
  materialId: string
  label: string
  confidence: number
  reason: string
  box: DetectionBox
  estimatedBuiltDelta: number
  condition: string
  visibleIssues: string[]
  recommendation: string
}

interface OpenAIVisionPayload {
  message: string
  detectedItems: OpenAIVisionItem[]
}

interface OpenAIResponseBody {
  output_text?: string
  output?: Array<{
    type?: string
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
  error?: {
    message?: string
  }
}

const visionSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
      description: "Short German user-facing summary of the inspection.",
    },
    detectedItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          materialId: {
            type: "string",
            description:
              "ID from the provided material list, or empty string if uncertain.",
          },
          label: {
            type: "string",
            description: "Detected component label in German.",
          },
          confidence: {
            type: "number",
            description: "Confidence from 0 to 1.",
          },
          reason: {
            type: "string",
            description: "Brief visual reason for the match.",
          },
          box: {
            type: "object",
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              width: { type: "number" },
              height: { type: "number" },
            },
            required: ["x", "y", "width", "height"],
            additionalProperties: false,
          },
          estimatedBuiltDelta: {
            type: "number",
            description:
              "Estimated newly visible built/installed amount. Use 0 if uncertain.",
          },
          condition: {
            type: "string",
            description: "Visible condition of the component.",
          },
          visibleIssues: {
            type: "array",
            items: { type: "string" },
          },
          recommendation: {
            type: "string",
            description:
              "What the user should review before applying data changes.",
          },
        },
        required: [
          "materialId",
          "label",
          "confidence",
          "reason",
          "box",
          "estimatedBuiltDelta",
          "condition",
          "visibleIssues",
          "recommendation",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["message", "detectedItems"],
  additionalProperties: false,
} as const

function getOutputText(response: OpenAIResponseBody) {
  if (response.output_text) {
    return response.output_text
  }

  return response.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === "output_text" && content.text)?.text
}

function clampPercentBox(box: DetectionBox): DetectionBox {
  return {
    x: Math.max(0, Math.min(100, Math.round(box.x))),
    y: Math.max(0, Math.min(100, Math.round(box.y))),
    width: Math.max(1, Math.min(100, Math.round(box.width))),
    height: Math.max(1, Math.min(100, Math.round(box.height))),
  }
}

function buildPrompt(
  mode: VisionInspectionMode,
  expectedItems: ExpectedVisionItem[],
  focusMaterialId?: string
) {
  const materialList = expectedItems
    .map(
      (item) =>
        `- ${item.id}: ${item.name}, unit ${item.einheit}, delivered ${item.geliefert}, installed ${item.verbaut}, remaining ${item.verbleibend}`
    )
    .join("\n")

  return [
    "You are a construction-site vision assistant for a hackathon demo.",
    "Analyse only visible building elements that match the provided material list.",
    "Do not invent IDs. If uncertain, use a low confidence score.",
    "Bounding boxes must be percentage values relative to the image.",
    mode === "detail"
      ? `Detail mode: the user is focusing on ${focusMaterialId ?? "one element"}. Estimate condition, visible defects, and a cautious quantity update.`
      : "Scan mode: search only for possible matches and give short hints for user confirmation.",
    "Material list:",
    materialList || "- no expected materials provided",
  ].join("\n")
}

function toVisionResponse(
  payload: OpenAIVisionPayload,
  request: VisionInspectRequest,
  expectedItems: ExpectedVisionItem[]
): VisionInspectResponse {
  const mode = request.mode ?? "scan"
  const expectedById = new Map(expectedItems.map((item) => [item.id, item]))
  const detections: VisionDetection[] = payload.detectedItems
    .filter((item) => expectedById.has(item.materialId))
    .slice(0, mode === "detail" ? 1 : 5)
    .map((item) => {
      const expected = expectedById.get(item.materialId)
      const delta = Math.max(0, Math.round(item.estimatedBuiltDelta))
      const verbaut = expected
        ? Math.min(expected.geliefert, expected.verbaut + delta)
        : delta

      return {
        id: `vision-${item.materialId}`,
        materialId: item.materialId,
        label: item.label,
        confidence: Number(
          Math.max(0, Math.min(1, item.confidence)).toFixed(2)
        ),
        reason: item.reason,
        box: clampPercentBox(item.box),
        systemMatch: {
          materialName: expected?.name ?? item.label,
          externeReferenz: expected?.externeReferenz,
        },
        interpreted: {
          geliefert: expected?.geliefert ?? 0,
          verbaut,
          verbleibend: expected ? Math.max(0, expected.geliefert - verbaut) : 0,
          einheit: expected?.einheit ?? "stueck",
        },
        detail:
          mode === "detail"
            ? {
                zustand: item.condition,
                geschaetzteAnzahl: delta,
                sichtbareMaengel: item.visibleIssues,
                empfehlung: item.recommendation,
              }
            : undefined,
      }
    })

  return {
    capturedAt: new Date().toISOString(),
    frameRate: mode === "scan" ? 0.25 : 1,
    source: "openai-vision",
    mode,
    summary: {
      expected: expectedItems.length,
      detected: detections.length,
      matched: detections.filter((detection) => detection.confidence >= 0.75)
        .length,
      needsConfirmation: true,
      message: payload.message,
    },
    detections,
  }
}

export async function analyzeImageWithOpenAI(
  request: VisionInspectRequest,
  apiKey: string
): Promise<VisionInspectResponse> {
  const expectedItems = (request.expectedItems ?? []).slice(0, 12)
  const mode = request.mode ?? "scan"
  const model = process.env.WBK_OPENAI_MODEL ?? "gpt-5.5"

  if (!request.image?.startsWith("data:image/")) {
    throw new Error("Vision analysis requires an image as a data URL.")
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildPrompt(mode, expectedItems, request.focusMaterialId),
            },
            {
              type: "input_image",
              image_url: request.image,
            },
          ],
        },
      ],
      max_output_tokens: mode === "detail" ? 900 : 700,
      text: {
        format: {
          type: "json_schema",
          name: "wbk_vision_inspection",
          strict: true,
          schema: visionSchema,
        },
      },
    }),
  })

  const body = (await response.json()) as OpenAIResponseBody

  if (!response.ok) {
    throw new Error(body.error?.message ?? "OpenAI Vision API failed.")
  }

  const outputText = getOutputText(body)

  if (!outputText) {
    throw new Error("OpenAI Vision API returned no structured response.")
  }

  return toVisionResponse(
    JSON.parse(outputText) as OpenAIVisionPayload,
    request,
    expectedItems
  )
}
