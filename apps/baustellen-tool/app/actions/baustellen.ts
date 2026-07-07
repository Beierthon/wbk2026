"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  adresse: z.string().max(300).default(""),
  projektleitung: z.string().max(200).default(""),
  beschreibung: z.string().max(1000).default(""),
})

export async function createBaustelle(input: z.input<typeof CreateSchema>) {
  const data = CreateSchema.parse(input)
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("bt_baustellen")
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/", "layout")
  return row
}

export async function deleteBaustelle(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("bt_baustellen").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/", "layout")
}
