import { createClient } from "@/lib/supabase/server"
import type { Bauplan } from "@/lib/domain/schemas"

export async function listBauplaene(baustelleId: string): Promise<Bauplan[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_bauplaene")
    .select("*")
    .eq("baustelle_id", baustelleId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Bauplan[]
}

export async function getBauplan(id: string): Promise<Bauplan | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_bauplaene")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as Bauplan | null) ?? null
}
