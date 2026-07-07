import { createClient } from "@/lib/supabase/server"
import type { Aktivitaet } from "@/lib/domain/schemas"

export async function listAktivitaeten(
  baustelleId: string,
  limit = 50,
): Promise<Aktivitaet[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_aktivitaeten")
    .select("*")
    .eq("baustelle_id", baustelleId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as Aktivitaet[]
}
