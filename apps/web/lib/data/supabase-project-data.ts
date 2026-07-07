import { DOMAIN_TABLES } from "@workspace/domain"
import type { SupabaseClient } from "@supabase/supabase-js"

import { RepositoryError } from "./errors"
import {
  mapAktivitaet,
  mapAsset,
  mapAuditEintrag,
  mapBauprojekt,
  mapBestellung,
  mapDatei,
  mapEntscheidung,
  mapExterneReferenz,
  mapKommentar,
  mapKonflikt,
  mapKostenprognose,
  mapMaterial,
  mapPlanstand,
  mapPlanversion,
  mapStandort,
  mapWartungsaufgabe,
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

  assertNoError(projektError, "Could not load Bauprojekt")

  if (!projektRow) {
    throw new RepositoryError("Project was not found in Supabase.", 404)
  }

  const projekt = mapBauprojekt(projektRow)

  const { data: standortRow, error: standortError } = await supabase
    .from(DOMAIN_TABLES.standorte)
    .select("*")
    .eq("id", projekt.standortId)
    .maybeSingle()

  assertNoError(standortError, "Could not load site")

  if (!standortRow) {
    throw new RepositoryError("Site was not found in Supabase.", 500)
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
    wartungsaufgabenResult,
    auditEintraegeResult,
    dateienResult,
  ] = await Promise.all([
    supabase
      .from(DOMAIN_TABLES.planstaende)
      .select("*")
      .eq("projekt_id", projectId),
    supabase
      .from(DOMAIN_TABLES.konflikte)
      .select("*")
      .eq("projekt_id", projectId),
    supabase
      .from(DOMAIN_TABLES.kommentare)
      .select("*")
      .eq("projekt_id", projectId),
    supabase
      .from(DOMAIN_TABLES.entscheidungen)
      .select("*")
      .eq("projekt_id", projectId),
    supabase
      .from(DOMAIN_TABLES.materialien)
      .select("*")
      .eq("projekt_id", projectId),
    supabase
      .from(DOMAIN_TABLES.bestellungen)
      .select("*")
      .eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.assets).select("*").eq("projekt_id", projectId),
    supabase
      .from(DOMAIN_TABLES.aktivitaeten)
      .select("*")
      .eq("projekt_id", projectId),
    supabase
      .from(DOMAIN_TABLES.externeReferenzen)
      .select("*")
      .eq("projekt_id", projectId),
    supabase
      .from(DOMAIN_TABLES.kostenprognosen)
      .select("*")
      .eq("projekt_id", projectId),
    supabase
      .from(DOMAIN_TABLES.wartungsaufgaben)
      .select("*")
      .eq("projekt_id", projectId),
    supabase
      .from(DOMAIN_TABLES.auditEintraege)
      .select("*")
      .eq("projekt_id", projectId),
    supabase
      .from(DOMAIN_TABLES.dateien)
      .select("*")
      .eq("projekt_id", projectId),
  ])

  assertNoError(planstaendeResult.error, "Could not load plan sets")
  assertNoError(konflikteResult.error, "Could not load conflicts")
  assertNoError(kommentareResult.error, "Could not load comments")
  assertNoError(entscheidungenResult.error, "Could not load decisions")
  assertNoError(materialienResult.error, "Could not load materials")
  assertNoError(bestellungenResult.error, "Could not load orders")
  assertNoError(assetsResult.error, "Could not load assets")
  assertNoError(aktivitaetenResult.error, "Could not load activities")
  assertNoError(
    externeReferenzenResult.error,
    "Could not load external references"
  )
  assertNoError(kostenprognosenResult.error, "Could not load cost forecasts")
  assertNoError(
    wartungsaufgabenResult.error,
    "Could not load maintenance tasks"
  )
  assertNoError(auditEintraegeResult.error, "Could not load audit entries")
  assertNoError(dateienResult.error, "Could not load files")

  const planstaende = (planstaendeResult.data ?? []).map(mapPlanstand)
  const planstandIds = planstaende.map((planstand) => planstand.id)

  let planversionen: ReturnType<typeof mapPlanversion>[] = []

  if (planstandIds.length > 0) {
    const { data: planversionRows, error: planversionError } = await supabase
      .from(DOMAIN_TABLES.planversionen)
      .select("*")
      .in("planstand_id", planstandIds)

    assertNoError(planversionError, "Could not load plan versions")
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
    externeReferenzen: (externeReferenzenResult.data ?? []).map(
      mapExterneReferenz
    ),
    kostenprognosen: (kostenprognosenResult.data ?? []).map(mapKostenprognose),
    wartungsaufgaben: (wartungsaufgabenResult.data ?? []).map(
      mapWartungsaufgabe
    ),
    auditEintraege: (auditEintraegeResult.data ?? []).map(mapAuditEintrag),
    planMarker: [],
    dateien: (dateienResult.data ?? []).map(mapDatei),
  }
}

export async function fetchAllProjects(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from(DOMAIN_TABLES.projekte)
    .select("*")
    .order("name")

  assertNoError(error, "Could not load projects")

  return (data ?? []).map(mapBauprojekt)
}
