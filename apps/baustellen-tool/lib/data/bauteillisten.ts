import { createClient } from "@/lib/supabase/server"
import type { BauteilPosition, Bauteilliste } from "@/lib/domain/schemas"

export async function listBauteillisten(baustelleId: string): Promise<Bauteilliste[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_bauteillisten")
    .select("*")
    .eq("baustelle_id", baustelleId)
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Bauteilliste[]
}

export async function getBauteilliste(id: string): Promise<Bauteilliste | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_bauteillisten")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as Bauteilliste | null) ?? null
}

export async function listPositionen(listeId: string): Promise<BauteilPosition[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_bauteil_positionen")
    .select("*")
    .eq("liste_id", listeId)
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as BauteilPosition[]
}

export async function getPosition(id: string): Promise<BauteilPosition | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_bauteil_positionen")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as BauteilPosition | null) ?? null
}
