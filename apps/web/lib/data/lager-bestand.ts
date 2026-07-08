import { DOMAIN_TABLES } from "@workspace/domain"
import { WBK_DEMO_DATA } from "@workspace/domain/demo-data"
import type { SupabaseClient } from "@supabase/supabase-js"

import { enrichLagerArtikelWithLieferanten } from "@/lib/lager/lieferant"
import { RepositoryError } from "./errors"
import { mapAktivitaet, mapLagerArtikel, mapLieferant } from "./supabase-mappers"
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
  const [artikelResult, lieferantenResult, aktivitaetenResult] = await Promise.all([
    supabase
      .from(DOMAIN_TABLES.lagerArtikel)
      .select("*")
      .eq("projekt_id", projectId)
      .order("name"),
    supabase
      .from(DOMAIN_TABLES.lieferanten)
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
      const demoLieferanten = WBK_DEMO_DATA.lieferanten.filter(
        (item) => item.projektId === projectId
      )
      const demoArtikel = enrichLagerArtikelWithLieferanten(
        WBK_DEMO_DATA.lagerArtikel.filter((item) => item.projektId === projectId),
        demoLieferanten
      )
      const aktivitaeten = aktivitaetenResult.error
        ? []
        : (aktivitaetenResult.data ?? []).map((row) =>
            mapAktivitaet(row as Parameters<typeof mapAktivitaet>[0])
          )
      return { artikel: demoArtikel, lieferanten: demoLieferanten, aktivitaeten }
    }
    assertNoError(artikelResult.error, "Lagerartikel konnten nicht geladen werden")
  }

  assertNoError(
    aktivitaetenResult.error,
    "Aktivitäten konnten nicht geladen werden"
  )

  const lieferanten =
    lieferantenResult.error || !lieferantenResult.data
      ? WBK_DEMO_DATA.lieferanten.filter((item) => item.projektId === projectId)
      : lieferantenResult.data.map((row) =>
          mapLieferant(row as Parameters<typeof mapLieferant>[0])
        )

  const artikel = (artikelResult.data ?? []).map((row) =>
    mapLagerArtikel(row as Parameters<typeof mapLagerArtikel>[0])
  )

  const aktivitaeten = (aktivitaetenResult.data ?? []).map((row) =>
    mapAktivitaet(row as Parameters<typeof mapAktivitaet>[0])
  )

  if (artikel.length === 0) {
    const demoLieferanten = WBK_DEMO_DATA.lieferanten.filter(
      (item) => item.projektId === projectId
    )
    const demoArtikel = enrichLagerArtikelWithLieferanten(
      WBK_DEMO_DATA.lagerArtikel.filter((item) => item.projektId === projectId),
      demoLieferanten
    )
    if (demoArtikel.length > 0) {
      return { artikel: demoArtikel, lieferanten: demoLieferanten, aktivitaeten }
    }
  }

  return {
    artikel: enrichLagerArtikelWithLieferanten(artikel, lieferanten),
    lieferanten,
    aktivitaeten,
  }
}
