"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { AUFTRAG_STATUS, AUFTRAG_TYPEN } from "@/lib/domain/schemas"
import type { AktivitaetTyp, AuftragStatus } from "@/lib/domain/schemas"
import { createClient } from "@/lib/supabase/server"

const CreateSchema = z.object({
  baustelle_id: z.string().uuid(),
  typ: z.enum(AUFTRAG_TYPEN),
  titel: z.string().trim().min(1).max(200),
  beschreibung: z.string().max(2000).default(""),
  zugewiesen_an: z.string().uuid().nullable().optional(),
  bezug_liste_id: z.string().uuid().nullable().optional(),
  bezug_position_id: z.string().uuid().nullable().optional(),
  bezug_bauplan_id: z.string().uuid().nullable().optional(),
  erstellt_von: z.string().max(200).default("Bauleitung"),
})

export async function createArbeitsauftrag(input: z.input<typeof CreateSchema>) {
  const data = CreateSchema.parse(input)
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from("bt_arbeitsauftraege")
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)

  await supabase.from("bt_aktivitaeten").insert({
    baustelle_id: data.baustelle_id,
    typ: "auftrag_erstellt",
    titel: `Neuer Auftrag: ${data.titel}`,
    beschreibung: data.beschreibung,
    bezug_auftrag_id: row.id,
    bezug_position_id: data.bezug_position_id ?? null,
    payload: {
      typ: data.typ,
      zugewiesen_an: data.zugewiesen_an ?? null,
      erstellt_von: data.erstellt_von,
    },
  })

  revalidatePath("/", "layout")
  return row
}

export async function updateAuftragStatus(id: string, status: AuftragStatus) {
  if (!AUFTRAG_STATUS.includes(status)) throw new Error(`Ungültiger Status: ${status}`)

  const supabase = await createClient()
  const { data: auftrag, error: fetchErr } = await supabase
    .from("bt_arbeitsauftraege")
    .select("baustelle_id, titel")
    .eq("id", id)
    .single()
  if (fetchErr) throw new Error(fetchErr.message)

  const patch: Record<string, unknown> = { status }
  if (status === "abgeschlossen" || status === "abgebrochen") {
    patch.abgeschlossen_am = new Date().toISOString()
  } else {
    patch.abgeschlossen_am = null
  }

  const { error } = await supabase.from("bt_arbeitsauftraege").update(patch).eq("id", id)
  if (error) throw new Error(error.message)

  await supabase.from("bt_aktivitaeten").insert({
    baustelle_id: auftrag.baustelle_id,
    typ: statusZuAktivitaetTyp(status),
    titel: `Auftrag ${statusLabel(status)}: ${auftrag.titel}`,
    beschreibung: "",
    bezug_auftrag_id: id,
    payload: { status },
  })

  revalidatePath("/", "layout")
}

export async function deleteArbeitsauftrag(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("bt_arbeitsauftraege").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/", "layout")
}

function statusZuAktivitaetTyp(status: AuftragStatus): AktivitaetTyp {
  switch (status) {
    case "in_arbeit":
      return "auftrag_in_arbeit"
    case "abgeschlossen":
      return "auftrag_abgeschlossen"
    case "abgebrochen":
      return "auftrag_abgebrochen"
    default:
      return "auftrag_erstellt"
  }
}

function statusLabel(status: AuftragStatus): string {
  switch (status) {
    case "in_arbeit":
      return "in Arbeit"
    case "abgeschlossen":
      return "abgeschlossen"
    case "abgebrochen":
      return "abgebrochen"
    case "offen":
      return "wieder offen"
  }
}
