import { DOMAIN_TABLES } from "@workspace/domain"
import { WBK_DEMO_DATA } from "@workspace/domain/demo-data"
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
      const demoArtikel = WBK_DEMO_DATA.lagerArtikel.filter(
        (item) => item.projektId === projectId
      )
      const aktivitaeten = aktivitaetenResult.error
        ? []
        : (aktivitaetenResult.data ?? []).map((row) =>
            mapAktivitaet(row as Parameters<typeof mapAktivitaet>[0])
          )
      return { artikel: demoArtikel, aktivitaeten }
    }
    assertNoError(artikelResult.error, "Lagerartikel konnten nicht geladen werden")
  }

  assertNoError(
    aktivitaetenResult.error,
    "Aktivitäten konnten nicht geladen werden"
  )

  const artikel = artikelResult.error
    ? []
    : (artikelResult.data ?? []).map((row) =>
        mapLagerArtikel(row as Parameters<typeof mapLagerArtikel>[0])
      )

  const aktivitaeten = (aktivitaetenResult.data ?? []).map((row) =>
    mapAktivitaet(row as Parameters<typeof mapAktivitaet>[0])
  )

  if (artikel.length === 0) {
    const demoArtikel = WBK_DEMO_DATA.lagerArtikel.filter(
      (item) => item.projektId === projectId
    )
    if (demoArtikel.length > 0) {
      return { artikel: demoArtikel, aktivitaeten }
    }
  }

  return { artikel, aktivitaeten }
}
