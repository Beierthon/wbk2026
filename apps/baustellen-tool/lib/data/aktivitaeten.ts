import { isMockMode } from "@/lib/data/config"
import { mockData } from "@/lib/data/mock-store"
import { createClient } from "@/lib/supabase/server"
import type { Aktivitaet } from "@/lib/domain/schemas"

export async function listAktivitaeten(
  baustelleId: string,
  limit = 50,
): Promise<Aktivitaet[]> {
  if (isMockMode()) return mockData.listAktivitaeten(baustelleId, limit)

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
