"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { isMockMode } from "@/lib/data/config"
import { mockData } from "@/lib/data/mock-store"
import { ROLLEN } from "@/lib/domain/schemas"
import { createClient } from "@/lib/supabase/server"

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  rolle: z.enum(ROLLEN),
  aktiv: z.boolean().default(true),
})

export async function createPerson(input: z.input<typeof CreateSchema>) {
  const data = CreateSchema.parse(input)

  if (isMockMode()) {
    const row = mockData.createPerson(data)
    revalidatePath("/", "layout")
    return row
  }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("bt_personen")
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/", "layout")
  return row
}

export async function togglePersonAktiv(id: string, aktiv: boolean) {
  if (isMockMode()) {
    mockData.togglePersonAktiv(id, aktiv)
    revalidatePath("/", "layout")
    return
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("bt_personen")
    .update({ aktiv })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/", "layout")
}

export async function deletePerson(id: string) {
  if (isMockMode()) {
    mockData.deletePerson(id)
    revalidatePath("/", "layout")
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from("bt_personen").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/", "layout")
}
