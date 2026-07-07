"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { LISTEN_TYPEN } from "@/lib/domain/schemas"
import { createClient } from "@/lib/supabase/server"

const CreateSchema = z.object({
  baustelle_id: z.string().uuid(),
  titel: z.string().trim().min(1).max(200),
  typ: z.enum(LISTEN_TYPEN),
  beschreibung: z.string().max(1000).default(""),
})

const UpdateSchema = z.object({
  id: z.string().uuid(),
  titel: z.string().trim().min(1).max(200).optional(),
  typ: z.enum(LISTEN_TYPEN).optional(),
  beschreibung: z.string().max(1000).optional(),
})

export async function createBauteilliste(input: z.input<typeof CreateSchema>) {
  const data = CreateSchema.parse(input)
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from("bt_bauteillisten")
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)

  await supabase.from("bt_aktivitaeten").insert({
    baustelle_id: data.baustelle_id,
    typ: "liste_erstellt",
    titel: `Neue Liste: ${data.titel}`,
    beschreibung: data.beschreibung,
    payload: { liste_id: row.id, liste_typ: data.typ },
  })

  revalidatePath("/", "layout")
  return row
}

export async function updateBauteilliste(input: z.input<typeof UpdateSchema>) {
  const { id, ...patch } = UpdateSchema.parse(input)
  const supabase = await createClient()
  const { error } = await supabase.from("bt_bauteillisten").update(patch).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/", "layout")
}

export async function deleteBauteilliste(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("bt_bauteillisten").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/", "layout")
}
