import { NextResponse } from "next/server"

import { AnalyzeRequestSchema } from "@/lib/vision/types"
import { analyzeImage } from "@/lib/vision"

export const runtime = "nodejs"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = AnalyzeRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad request", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const result = await analyzeImage(parsed.data)
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analyse fehlgeschlagen."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
