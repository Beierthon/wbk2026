"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const DATEITYPEN = ["pdf", "png", "jpg", "jpeg", "webp", "dwg", "dxf"] as const

const CreateSchema = z.object({
  baustelle_id: z.string().uuid(),
  titel: z.string().trim().min(1).max(200),
  beschreibung: z.string().max(1000).default(""),
  datei_pfad: z.string().min(1),
  dateityp: z.enum(DATEITYPEN),
  version: z.coerce.number().int().positive().default(1),
  hochgeladen_von: z.string().max(200).default(""),
})

export async function createBauplan(input: z.input<typeof CreateSchema>) {
  const data = CreateSchema.parse(input)
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from("bt_bauplaene")
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)

  await supabase.from("bt_aktivitaeten").insert({
    baustelle_id: data.baustelle_id,
    typ: "bauplan_hochgeladen",
    titel: `Neuer Bauplan: ${data.titel}`,
    beschreibung: data.beschreibung,
    bezug_bauplan_id: row.id,
    payload: {
      dateityp: data.dateityp,
      version: data.version,
      hochgeladen_von: data.hochgeladen_von,
    },
  })

  revalidatePath("/", "layout")
  return row
}

export async function deleteBauplan(id: string, dateiPfad: string) {
  const supabase = await createClient()
  await supabase.storage.from("bt_bauplaene").remove([dateiPfad])
  const { error } = await supabase.from("bt_bauplaene").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/", "layout")
}
