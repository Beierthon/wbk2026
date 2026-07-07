import { DOMAIN_TABLES } from "@workspace/domain"
import type { SupabaseClient } from "@supabase/supabase-js"

import { RepositoryError } from "./errors"
import {
  mapAktivitaet,
  mapAsset,
  mapBauprojekt,
  mapBestellung,
  mapEntscheidung,
  mapExterneReferenz,
  mapKommentar,
  mapKonflikt,
  mapKostenprognose,
  mapMaterial,
  mapPlanstand,
  mapPlanversion,
  mapStandort,
} from "./supabase-mappers"
import type { ProjectDashboardData } from "./types"

function assertNoError(error: { message: string } | null, context: string) {
  if (error) {
    throw new RepositoryError(`${context}: ${error.message}`, 500)
  }
}

export async function fetchProjectDashboardData(
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectDashboardData> {
  const { data: projektRow, error: projektError } = await supabase
    .from(DOMAIN_TABLES.projekte)
    .select("*")
    .eq("id", projectId)
    .maybeSingle()

  assertNoError(projektError, "Bauprojekt konnte nicht geladen werden")

  if (!projektRow) {
    throw new RepositoryError("Projekt wurde in Supabase nicht gefunden.", 404)
  }

  const projekt = mapBauprojekt(projektRow)

  const { data: standortRow, error: standortError } = await supabase
    .from(DOMAIN_TABLES.standorte)
    .select("*")
    .eq("id", projekt.standortId)
    .maybeSingle()

  assertNoError(standortError, "Standort konnte nicht geladen werden")

  if (!standortRow) {
    throw new RepositoryError("Standort wurde in Supabase nicht gefunden.", 500)
  }

  const standort = mapStandort(standortRow)

  const [
    planstaendeResult,
    konflikteResult,
    kommentareResult,
    entscheidungenResult,
    materialienResult,
    bestellungenResult,
    assetsResult,
    aktivitaetenResult,
    externeReferenzenResult,
    kostenprognosenResult,
  ] = await Promise.all([
    supabase.from(DOMAIN_TABLES.planstaende).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.konflikte).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.kommentare).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.entscheidungen).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.materialien).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.bestellungen).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.assets).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.aktivitaeten).select("*").eq("projekt_id", projectId),
    supabase
      .from(DOMAIN_TABLES.externeReferenzen)
      .select("*")
      .eq("projekt_id", projectId),
    supabase
      .from(DOMAIN_TABLES.kostenprognosen)
      .select("*")
      .eq("projekt_id", projectId),
  ])

  assertNoError(planstaendeResult.error, "Planstaende konnten nicht geladen werden")
  assertNoError(konflikteResult.error, "Konflikte konnten nicht geladen werden")
  assertNoError(kommentareResult.error, "Kommentare konnten nicht geladen werden")
  assertNoError(
    entscheidungenResult.error,
    "Entscheidungen konnten nicht geladen werden"
  )
  assertNoError(materialienResult.error, "Materialien konnten nicht geladen werden")
  assertNoError(bestellungenResult.error, "Bestellungen konnten nicht geladen werden")
  assertNoError(assetsResult.error, "Assets konnten nicht geladen werden")
  assertNoError(aktivitaetenResult.error, "Aktivitaeten konnten nicht geladen werden")
  assertNoError(
    externeReferenzenResult.error,
    "Externe Referenzen konnten nicht geladen werden"
  )
  assertNoError(
    kostenprognosenResult.error,
    "Kostenprognosen konnten nicht geladen werden"
  )

  const planstaende = (planstaendeResult.data ?? []).map(mapPlanstand)
  const planstandIds = planstaende.map((planstand) => planstand.id)

  let planversionen: ReturnType<typeof mapPlanversion>[] = []

  if (planstandIds.length > 0) {
    const { data: planversionRows, error: planversionError } = await supabase
      .from(DOMAIN_TABLES.planversionen)
      .select("*")
      .in("planstand_id", planstandIds)

    assertNoError(planversionError, "Planversionen konnten nicht geladen werden")
    planversionen = (planversionRows ?? []).map(mapPlanversion)
  }

  return {
    projekt,
    standort,
    planstaende,
    planversionen,
    konflikte: (konflikteResult.data ?? []).map(mapKonflikt),
    kommentare: (kommentareResult.data ?? []).map(mapKommentar),
    entscheidungen: (entscheidungenResult.data ?? []).map(mapEntscheidung),
    materialien: (materialienResult.data ?? []).map(mapMaterial),
    bestellungen: (bestellungenResult.data ?? []).map(mapBestellung),
    assets: (assetsResult.data ?? []).map(mapAsset),
    aktivitaeten: (aktivitaetenResult.data ?? []).map(mapAktivitaet),
    externeReferenzen: (externeReferenzenResult.data ?? []).map(mapExterneReferenz),
    kostenprognosen: (kostenprognosenResult.data ?? []).map(mapKostenprognose),
  }
}

export async function fetchAllProjects(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from(DOMAIN_TABLES.projekte)
    .select("*")
    .order("name")

  assertNoError(error, "Projekte konnten nicht geladen werden")

  return (data ?? []).map(mapBauprojekt)
}
