import { DOMAIN_TABLES } from "@workspace/domain"
import type { SupabaseClient } from "@supabase/supabase-js"

import { RepositoryError } from "./errors"
import {
  mapAktivitaet,
  mapAsset,
  mapAuditEintrag,
  mapBauabschnitt,
  mapBauabschnittAbhaengigkeit,
  mapBauabschnittMitarbeiter,
  mapBauprojekt,
  mapBestellung,
  mapDatei,
  mapEntscheidung,
  mapExterneReferenz,
  mapKommentar,
  mapKonflikt,
  mapKostenprognose,
  mapMaterial,
  mapMitarbeiter,
  mapMitarbeiterAusfall,
  mapPlanMarker,
  mapPlanstand,
  mapPlanversion,
  mapStandort,
  mapTerminplanBlockierung,
  mapTerminplanSzenario,
  mapTerminplanVerschiebung,
  mapWartungsaufgabe,
} from "./supabase-mappers"
import type { ProjectDashboardData } from "./types"

function assertNoError(error: { message: string; code?: string } | null, context: string) {
  if (error) {
    throw new RepositoryError(`${context}: ${error.message}`, 500)
  }
}

function isMissingTableError(
  error: { message: string; code?: string } | null,
  tableName: string
) {
  if (!error) {
    return false
  }

  return (
    error.code === "PGRST205" ||
    error.message.includes(`'public.${tableName}'`) ||
    error.message.includes(`public.${tableName}`)
  )
}

function mapPlanMarkersOrEmpty(
  result: { data: unknown[] | null; error: { message: string; code?: string } | null }
) {
  if (result.error) {
    if (isMissingTableError(result.error, DOMAIN_TABLES.planMarker)) {
      return []
    }

    throw new RepositoryError(
      `Plan-Marker konnten nicht geladen werden: ${result.error.message}`,
      500
    )
  }

  return (result.data ?? []).map((row) => mapPlanMarker(row as Parameters<typeof mapPlanMarker>[0]))
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
    wartungsaufgabenResult,
    auditEintraegeResult,
    dateienResult,
    terminplanSzenarienResult,
    bauabschnitteResult,
    abhaengigkeitenResult,
    verschiebungenResult,
    blockierungenResult,
    mitarbeiterResult,
    ausfaelleResult,
    zuordnungenResult,
    planMarkerResult,
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
    supabase
      .from(DOMAIN_TABLES.wartungsaufgaben)
      .select("*")
      .eq("projekt_id", projectId),
    supabase
      .from(DOMAIN_TABLES.auditEintraege)
      .select("*")
      .eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.dateien).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.terminplanSzenarien).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.bauabschnitte).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.bauabschnittAbhaengigkeiten).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.terminplanVerschiebungen).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.terminplanBlockierungen).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.mitarbeiter).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.mitarbeiterAusfaelle).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.bauabschnittMitarbeiter).select("*").eq("projekt_id", projectId),
    supabase.from(DOMAIN_TABLES.planMarker).select("*").eq("projekt_id", projectId),
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
  assertNoError(
    wartungsaufgabenResult.error,
    "Wartungsaufgaben konnten nicht geladen werden"
  )
  assertNoError(
    auditEintraegeResult.error,
    "Audit-Einträge konnten nicht geladen werden"
  )
  assertNoError(dateienResult.error, "Dateien konnten nicht geladen werden")
  assertNoError(
    terminplanSzenarienResult.error,
    "Terminplan-Szenarien konnten nicht geladen werden"
  )
  assertNoError(bauabschnitteResult.error, "Bauabschnitte konnten nicht geladen werden")
  assertNoError(
    abhaengigkeitenResult.error,
    "Bauabschnitt-Abhängigkeiten konnten nicht geladen werden"
  )
  assertNoError(
    verschiebungenResult.error,
    "Terminplan-Verschiebungen konnten nicht geladen werden"
  )
  assertNoError(
    blockierungenResult.error,
    "Terminplan-Blockierungen konnten nicht geladen werden"
  )
  assertNoError(mitarbeiterResult.error, "Mitarbeiter konnten nicht geladen werden")
  assertNoError(
    ausfaelleResult.error,
    "Mitarbeiter-Ausfälle konnten nicht geladen werden"
  )
  assertNoError(
    zuordnungenResult.error,
    "Bauabschnitt-Mitarbeiter konnten nicht geladen werden"
  )

  const planMarker = mapPlanMarkersOrEmpty(planMarkerResult)

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
    wartungsaufgaben: (wartungsaufgabenResult.data ?? []).map(mapWartungsaufgabe),
    auditEintraege: (auditEintraegeResult.data ?? []).map(mapAuditEintrag),
    planMarker,
    dateien: (dateienResult.data ?? []).map(mapDatei),
    terminplanSzenarien: (terminplanSzenarienResult.data ?? []).map(mapTerminplanSzenario),
    bauabschnitte: (bauabschnitteResult.data ?? []).map(mapBauabschnitt),
    bauabschnittAbhaengigkeiten: (abhaengigkeitenResult.data ?? []).map(
      mapBauabschnittAbhaengigkeit
    ),
    terminplanVerschiebungen: (verschiebungenResult.data ?? []).map(
      mapTerminplanVerschiebung
    ),
    terminplanBlockierungen: (blockierungenResult.data ?? []).map(
      mapTerminplanBlockierung
    ),
    mitarbeiter: (mitarbeiterResult.data ?? []).map(mapMitarbeiter),
    mitarbeiterAusfaelle: (ausfaelleResult.data ?? []).map(mapMitarbeiterAusfall),
    bauabschnittMitarbeiter: (zuordnungenResult.data ?? []).map(
      mapBauabschnittMitarbeiter
    ),
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
