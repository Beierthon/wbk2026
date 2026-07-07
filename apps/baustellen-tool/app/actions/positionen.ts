"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { EINHEITEN } from "@/lib/domain/schemas"
import { createClient } from "@/lib/supabase/server"

const CreateSchema = z.object({
  liste_id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  einheit: z.enum(EINHEITEN),
  sollmenge: z.coerce.number().min(0).default(0),
  istmenge: z.coerce.number().min(0).default(0),
  bauabschnitt: z.string().max(200).default(""),
  beschreibung: z.string().max(1000).default(""),
})

const UpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(200).optional(),
  einheit: z.enum(EINHEITEN).optional(),
  sollmenge: z.coerce.number().min(0).optional(),
  istmenge: z.coerce.number().min(0).optional(),
  bauabschnitt: z.string().max(200).optional(),
  beschreibung: z.string().max(1000).optional(),
})

export async function createPosition(input: z.input<typeof CreateSchema>) {
  const data = CreateSchema.parse(input)
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("bt_bauteil_positionen")
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)

  revalidatePath("/", "layout")
  return row
}

export async function updatePosition(input: z.input<typeof UpdateSchema>) {
  const { id, ...patch } = UpdateSchema.parse(input)
  const supabase = await createClient()
  const { error } = await supabase.from("bt_bauteil_positionen").update(patch).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/", "layout")
}

export async function deletePosition(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("bt_bauteil_positionen").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/", "layout")
}
