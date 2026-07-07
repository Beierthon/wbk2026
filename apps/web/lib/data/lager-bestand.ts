import { DOMAIN_TABLES } from "@workspace/domain"
import type { SupabaseClient } from "@supabase/supabase-js"

import { RepositoryError } from "./errors"
import { mapAktivitaet, mapLagerArtikel } from "./supabase-mappers"
import type { LagerBestandData } from "./types"

function assertNoError(error: { message: string } | null, context: string) {
  if (error) {
    throw new RepositoryError(`${context}: ${error.message}`, 500)
  }
}

export async function fetchLagerBestand(
  supabase: SupabaseClient,
  projectId: string
): Promise<LagerBestandData> {
  const [artikelResult, aktivitaetenResult] = await Promise.all([
    supabase
      .from(DOMAIN_TABLES.lagerArtikel)
      .select("*")
      .eq("projekt_id", projectId)
      .order("name"),
    supabase
      .from(DOMAIN_TABLES.aktivitaeten)
      .select("*")
      .eq("projekt_id", projectId)
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  if (artikelResult.error) {
    if (
      artikelResult.error.code === "PGRST205" ||
      artikelResult.error.message.includes("lager_artikel")
    ) {
      return { artikel: [], aktivitaeten: [] }
    }
    assertNoError(artikelResult.error, "Lagerartikel konnten nicht geladen werden")
  }

  assertNoError(
    aktivitaetenResult.error,
    "Aktivitäten konnten nicht geladen werden"
  )

  return {
    artikel: (artikelResult.data ?? []).map((row) =>
      mapLagerArtikel(row as Parameters<typeof mapLagerArtikel>[0])
    ),
    aktivitaeten: (aktivitaetenResult.data ?? []).map((row) =>
      mapAktivitaet(row as Parameters<typeof mapAktivitaet>[0])
    ),
  }
}
