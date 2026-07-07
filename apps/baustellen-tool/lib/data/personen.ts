import { isMockMode } from "@/lib/data/config"
import { mockData } from "@/lib/data/mock-store"
import { createClient } from "@/lib/supabase/server"
import type { Person, Rolle } from "@/lib/domain/schemas"

export async function listPersonen(): Promise<Person[]> {
  if (isMockMode()) return mockData.listPersonen()

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
  if (isMockMode()) return mockData.listPersonenByRolle(rolle)

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
  if (isMockMode()) return mockData.getPerson(id)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_personen")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as Person | null) ?? null
}
