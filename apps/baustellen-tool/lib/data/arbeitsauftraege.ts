import { createClient } from "@/lib/supabase/server"
import type { Arbeitsauftrag, AuftragErgebnis, AuftragStatus } from "@/lib/domain/schemas"

export type AuftragMitBezug = Arbeitsauftrag & {
  person_name: string | null
  position_name: string | null
  position_einheit: string | null
  position_sollmenge: number | null
  liste_titel: string | null
}

export async function listAuftraege(baustelleId: string): Promise<AuftragMitBezug[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_arbeitsauftraege")
    .select(`
      *,
      person:zugewiesen_an ( name ),
      position:bezug_position_id ( name, einheit, sollmenge ),
      liste:bezug_liste_id ( titel )
    `)
    .eq("baustelle_id", baustelleId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapAuftragMitBezug)
}

export async function listAuftraegeFuerPerson(personId: string): Promise<AuftragMitBezug[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_arbeitsauftraege")
    .select(`
      *,
      person:zugewiesen_an ( name ),
      position:bezug_position_id ( name, einheit, sollmenge ),
      liste:bezug_liste_id ( titel )
    `)
    .eq("zugewiesen_an", personId)
    .in("status", ["offen", "in_arbeit"])
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapAuftragMitBezug)
}

export async function getAuftrag(id: string): Promise<AuftragMitBezug | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_arbeitsauftraege")
    .select(`
      *,
      person:zugewiesen_an ( name ),
      position:bezug_position_id ( name, einheit, sollmenge ),
      liste:bezug_liste_id ( titel )
    `)
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return mapAuftragMitBezug(data)
}

export async function listErgebnisse(auftragId: string): Promise<AuftragErgebnis[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_auftrag_ergebnisse")
    .select("*")
    .eq("auftrag_id", auftragId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as AuftragErgebnis[]
}

export async function countAuftraegeByStatus(
  baustelleId: string,
): Promise<Record<AuftragStatus, number>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_arbeitsauftraege")
    .select("status")
    .eq("baustelle_id", baustelleId)

  if (error) throw new Error(error.message)

  const counts: Record<AuftragStatus, number> = {
    offen: 0,
    in_arbeit: 0,
    abgeschlossen: 0,
    abgebrochen: 0,
  }
  for (const row of data ?? []) {
    const status = row.status as AuftragStatus
    counts[status] = (counts[status] ?? 0) + 1
  }
  return counts
}

type AuftragRow = Arbeitsauftrag & {
  person?: { name: string } | { name: string }[] | null
  position?:
    | { name: string; einheit: string; sollmenge: number }
    | { name: string; einheit: string; sollmenge: number }[]
    | null
  liste?: { titel: string } | { titel: string }[] | null
}

function mapAuftragMitBezug(row: AuftragRow): AuftragMitBezug {
  const person = pickOne(row.person)
  const position = pickOne(row.position)
  const liste = pickOne(row.liste)
  return {
    ...row,
    person_name: person?.name ?? null,
    position_name: position?.name ?? null,
    position_einheit: position?.einheit ?? null,
    position_sollmenge: position?.sollmenge ?? null,
    liste_titel: liste?.titel ?? null,
  }
}

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  if (Array.isArray(value)) return value[0] ?? null
  return value
}
