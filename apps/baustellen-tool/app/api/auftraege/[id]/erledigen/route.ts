import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const BodySchema = z.object({
  bestaetigte_menge: z.number(),
  notiz: z.string().max(2000).default(""),
  ai_estimate: z.number().nullable().optional(),
  ai_confidence: z.number().min(0).max(1).nullable().optional(),
  ai_interpretation: z.string().default(""),
  ai_raw: z.unknown().optional(),
  foto_pfad: z.string().nullable().optional(),
  erstellt_von: z.string().default("Shopfloor"),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad request", issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const data = parsed.data

  const supabase = await createClient()

  const { data: auftrag, error: fetchErr } = await supabase
    .from("bt_arbeitsauftraege")
    .select(
      "id, baustelle_id, titel, bezug_position_id, bezug_liste_id, typ, zugewiesen_an",
    )
    .eq("id", id)
    .single()
  if (fetchErr || !auftrag) {
    return NextResponse.json(
      { error: fetchErr?.message ?? "Auftrag nicht gefunden" },
      { status: 404 },
    )
  }

  const { data: ergebnis, error: ergErr } = await supabase
    .from("bt_auftrag_ergebnisse")
    .insert({
      auftrag_id: id,
      foto_pfad: data.foto_pfad ?? null,
      ai_estimate: data.ai_estimate ?? null,
      ai_confidence: data.ai_confidence ?? null,
      ai_interpretation: data.ai_interpretation,
      ai_raw: data.ai_raw ?? {},
      bestaetigte_menge: data.bestaetigte_menge,
      notiz: data.notiz,
      final: true,
      erstellt_von: data.erstellt_von,
    })
    .select()
    .single()
  if (ergErr) {
    return NextResponse.json({ error: ergErr.message }, { status: 500 })
  }

  if (auftrag.bezug_position_id) {
    const { error: posErr } = await supabase
      .from("bt_bauteil_positionen")
      .update({
        istmenge: data.bestaetigte_menge,
        letztes_update_am: new Date().toISOString(),
        letztes_update_von_auftrag_id: id,
      })
      .eq("id", auftrag.bezug_position_id)
    if (posErr) {
      return NextResponse.json({ error: posErr.message }, { status: 500 })
    }
  }

  const nowIso = new Date().toISOString()
  await supabase
    .from("bt_arbeitsauftraege")
    .update({ status: "abgeschlossen", abgeschlossen_am: nowIso })
    .eq("id", id)

  await supabase.from("bt_aktivitaeten").insert({
    baustelle_id: auftrag.baustelle_id,
    typ: "auftrag_abgeschlossen",
    titel: `Auftrag abgeschlossen: ${auftrag.titel}`,
    beschreibung: `Bestätigt: ${data.bestaetigte_menge}${
      data.ai_estimate != null ? ` (AI-Schätzung: ${data.ai_estimate})` : ""
    }`,
    bezug_auftrag_id: id,
    bezug_position_id: auftrag.bezug_position_id ?? null,
    payload: {
      bestaetigte_menge: data.bestaetigte_menge,
      ai_estimate: data.ai_estimate ?? null,
      ai_confidence: data.ai_confidence ?? null,
      erstellt_von: data.erstellt_von,
    },
  })

  return NextResponse.json({ ok: true, ergebnis_id: ergebnis.id })
}
