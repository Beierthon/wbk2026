import { createClient } from "@/lib/supabase/server"
import type { Person, Rolle } from "@/lib/domain/schemas"

export async function listPersonen(): Promise<Person[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_personen")
    .select("*")
    .eq("aktiv", true)
    .order("name", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Person[]
}

export async function listPersonenByRolle(rolle: Rolle): Promise<Person[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_personen")
    .select("*")
    .eq("aktiv", true)
    .eq("rolle", rolle)
    .order("name", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Person[]
}

export async function getPerson(id: string): Promise<Person | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_personen")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as Person | null) ?? null
}
