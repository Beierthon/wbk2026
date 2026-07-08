"use server"

import {
  aktualisiereLagerArtikel,
  createEntscheidung,
  createKommentar,
  bearbeiteLagerArtikel,
  erstelleLagerArtikel,
  loescheLagerArtikel,
  markierePlanAnnotation,
  meldeKonflikt,
  meldeMaterialSchnell,
  publishPlanversion,
  speicherePlanAbgleich,
  uebergebeAsset,
  updateKonfliktStatus,
  type ConflictSeverity,
  type ConflictStatus,
  type MaterialSchnellArt,
  type PlanAbweichungMarker,
  type PlanMarkerTyp,
  type ProjectPhase,
  type LagerArtikel,
} from "@workspace/domain"
import { invalidateProjectCache } from "@/lib/cache/invalidate"
import { getProjectRepository } from "@/lib/data"
import { getDataSourceMode } from "@/lib/data/config"
import { mapLagerArtikel } from "@/lib/data/supabase-mappers"
import { getActiveProjectId } from "@/lib/project"
import { createClient } from "@/lib/supabase/server"
import { hasSupabasePublicEnv } from "@/lib/supabase/env"

import { createMutationContext, optionalField, requireField } from "./context"

const repository = getProjectRepository()

function revalidateProject(projektId: string) {
  invalidateProjectCache(projektId)
}

async function loadData(projektId: string) {
  const { data } = await repository.getDashboardData(projektId)
  return data
}

const PHASEN: ProjectPhase[] = ["planung", "bau", "betrieb"]
const PRIORITAETEN: ConflictSeverity[] = [
  "niedrig",
  "mittel",
  "hoch",
  "kritisch",
]
const KONFLIKT_STATUS: ConflictStatus[] = [
  "neu",
  "in_pruefung",
  "entscheidung_noetig",
  "geloest",
  "uebernommen",
]
const MATERIAL_SCHNELL_ARTEN: MaterialSchnellArt[] = [
  "bestand_niedrig",
  "geliefert",
  "ersatz_noetig",
  "verloren",
  "gestohlen",
  "beschaedigt",
]
const MARKER_TYPEN: PlanMarkerTyp[] = [
  "konflikt",
  "rueckfrage",
  "material",
  "sicherheit",
]

function parsePhase(value: string, fallback: ProjectPhase): ProjectPhase {
  return PHASEN.includes(value as ProjectPhase)
    ? (value as ProjectPhase)
    : fallback
}

// --- Plan-Annotation (#24) -------------------------------------------------

export async function createPlanMarkerAction(formData: FormData) {
  const projektId = await getActiveProjectId()
  const planversionId = requireField(formData, "planversionId")
  const typRaw = requireField(formData, "typ")
  if (!MARKER_TYPEN.includes(typRaw as PlanMarkerTyp)) {
    throw new Error("Unknown marker type.")
  }
  const typ = typRaw as PlanMarkerTyp
  const titel = requireField(formData, "titel")
  const beschreibung =
    optionalField(formData, "beschreibung") ??
    optionalField(formData, "kommentarText") ??
    ""
  const autor = optionalField(formData, "autor") ?? "Planning"
  const rolle = parsePhase(
    optionalField(formData, "rolle") ?? "planung",
    "planung"
  )
  const xPercent = Number(optionalField(formData, "xPercent") ?? "50")
  const yPercent = Number(optionalField(formData, "yPercent") ?? "50")

  if (Number.isNaN(xPercent) || Number.isNaN(yPercent)) {
    throw new Error("Invalid marker position.")
  }

  const prioritaetRaw = optionalField(formData, "prioritaet") ?? "mittel"
  const prioritaet = PRIORITAETEN.includes(prioritaetRaw as ConflictSeverity)
    ? (prioritaetRaw as ConflictSeverity)
    : "mittel"
  const kostenwirkungRaw = optionalField(formData, "kostenwirkungCent")
  const kostenwirkungCent = kostenwirkungRaw
    ? Number(kostenwirkungRaw)
    : undefined
  const zeitwirkungRaw = optionalField(formData, "zeitwirkungTage")
  const zeitwirkungTage = zeitwirkungRaw ? Number(zeitwirkungRaw) : undefined

  const ctx = createMutationContext({
    actor: autor,
    quelle: "ui",
    geraet: optionalField(formData, "geraet") === "mobil" ? "mobil" : "desktop",
  })

  const result = markierePlanAnnotation(
    {
      projektId,
      planversionId,
      typ,
      xPercent,
      yPercent,
      titel,
      beschreibung,
      autor,
      rolle,
      verantwortlich: optionalField(formData, "verantwortlich"),
      prioritaet: typ === "konflikt" ? prioritaet : undefined,
      kostenwirkungCent: typ === "konflikt" ? kostenwirkungCent : undefined,
      zeitwirkungTage: typ === "konflikt" ? zeitwirkungTage : undefined,
    },
    ctx
  )
  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)
}

// --- Planung: neue Planversion veröffentlichen -----------------------------

export async function publishPlanversionAction(formData: FormData) {
  const projektId = await getActiveProjectId()
  const planstandId = requireField(formData, "planstandId")
  const version = requireField(formData, "version")
  const aenderungsnotiz = requireField(formData, "aenderungsnotiz")
  const veroeffentlichtVon =
    optionalField(formData, "veroeffentlichtVon") ?? "Planning"

  const data = await loadData(projektId)
  const planstand = data.planstaende.find((item) => item.id === planstandId)
  if (!planstand) {
    throw new Error("Plan set not found.")
  }
  const aktuelleVersion = data.planversionen.find(
    (item) => item.id === planstand.aktuelleVersionId
  )

  const ctx = createMutationContext({ actor: veroeffentlichtVon, quelle: "ui" })
  const result = publishPlanversion(
    {
      planstand,
      aktuelleVersion,
      version,
      aenderungsnotiz,
      veroeffentlichtVon,
    },
    ctx
  )
  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)
}

// --- Konflikt melden -------------------------------------------------------

export async function meldeKonfliktAction(formData: FormData) {
  const projektId = await getActiveProjectId()
  const titel = requireField(formData, "titel")
  const beschreibung = requireField(formData, "beschreibung")
  const quelle = parsePhase(optionalField(formData, "quelle") ?? "bau", "bau")
  const zielDomaene = parsePhase(
    optionalField(formData, "zielDomaene") ?? "planung",
    "planung"
  )
  const prioritaetRaw = optionalField(formData, "prioritaet") ?? "mittel"
  const prioritaet = PRIORITAETEN.includes(prioritaetRaw as ConflictSeverity)
    ? (prioritaetRaw as ConflictSeverity)
    : "mittel"
  const verantwortlich =
    optionalField(formData, "verantwortlich") ?? "Site management"
  const planversionId = optionalField(formData, "planversionId")
  const zeitwirkungRaw = optionalField(formData, "zeitwirkungTage")
  const zeitwirkungTage = zeitwirkungRaw ? Number(zeitwirkungRaw) : undefined
  const bauabschnittId = optionalField(formData, "bauabschnittId")

  const ctx = createMutationContext({
    actor: verantwortlich,
    quelle: "ui",
    geraet: optionalField(formData, "geraet") === "mobil" ? "mobil" : "desktop",
  })
  const result = meldeKonflikt(
    {
      projektId,
      titel,
      beschreibung,
      quelle,
      zielDomaene,
      prioritaet,
      verantwortlich,
      planversionId,
      zeitwirkungTage,
    },
    ctx
  )
  await repository.applyMutation(projektId, result)

  if (zeitwirkungTage && zeitwirkungTage > 0 && bauabschnittId) {
    const refreshed = await loadData(projektId)
    const bauabschnitt = refreshed.bauabschnitte.find(
      (a) => a.id === bauabschnittId
    )
    const konflikt = result.upserts.konflikte?.[0]
    const aktivesSzenario =
      refreshed.terminplanSzenarien.find((s) => s.istAktiv) ??
      refreshed.terminplanSzenarien[0]

    if (bauabschnitt && konflikt && aktivesSzenario) {
      const { blockiereBauabschnitt, verschiebeBauabschnitt } =
        await import("@workspace/domain")
      const blockResult = blockiereBauabschnitt(
        {
          projektId,
          bauabschnittId,
          blockiertDurchTyp: "konflikt",
          blockiertDurchId: konflikt.id,
          blockiertSeit: new Date().toISOString().slice(0, 10),
          bauabschnitt,
        },
        ctx
      )
      await repository.applyMutation(projektId, blockResult)

      const szenarioAbschnitte = refreshed.bauabschnitte.filter(
        (a) => a.szenarioId === aktivesSzenario.id
      )
      const shiftResult = verschiebeBauabschnitt(
        {
          eingabe: {
            bauabschnittId,
            tage: zeitwirkungTage,
            strategie: "kaskade",
            ursache: "konflikt",
            grund: beschreibung,
            entschiedenVon: verantwortlich,
            konfliktId: konflikt.id,
          },
          szenarioId: aktivesSzenario.id,
          bauabschnitte: szenarioAbschnitte,
          abhaengigkeiten: refreshed.bauabschnittAbhaengigkeiten,
          bisherigeVerschiebungen: refreshed.terminplanVerschiebungen,
        },
        ctx
      )
      await repository.applyMutation(projektId, shiftResult)
    }
  }

  revalidateProject(projektId)
}

// --- Kommentar an Konflikt oder Planversion --------------------------------

export async function createKommentarAction(formData: FormData) {
  const projektId = await getActiveProjectId()
  const text = requireField(formData, "text")
  const autor = optionalField(formData, "autor") ?? "Project stakeholder"
  const rolle = parsePhase(optionalField(formData, "rolle") ?? "bau", "bau")
  const konfliktId = optionalField(formData, "konfliktId")
  const planversionId = optionalField(formData, "planversionId")

  const ctx = createMutationContext({ actor: autor, quelle: "ui" })
  const result = createKommentar(
    { projektId, text, autor, rolle, konfliktId, planversionId },
    ctx
  )
  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)
}

// --- Konfliktstatus ändern -------------------------------------------------

export async function updateKonfliktStatusAction(formData: FormData) {
  const projektId = await getActiveProjectId()
  const konfliktId = requireField(formData, "konfliktId")
  const statusRaw = requireField(formData, "status")
  const status = KONFLIKT_STATUS.includes(statusRaw as ConflictStatus)
    ? (statusRaw as ConflictStatus)
    : undefined
  if (!status) {
    throw new Error("Unknown conflict status.")
  }
  const actorRolle = optionalField(formData, "actorRolle")

  const data = await loadData(projektId)
  const konflikt = data.konflikte.find((item) => item.id === konfliktId)
  if (!konflikt) {
    throw new Error("Conflict not found.")
  }

  const ctx = createMutationContext({
    actor: optionalField(formData, "actor") ?? "Project control",
    quelle: "ui",
  })
  const result = updateKonfliktStatus(
    konflikt,
    {
      status,
      actorRolle: actorRolle ? parsePhase(actorRolle, "planung") : undefined,
    },
    ctx
  )
  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)
}

// --- Material-Schnellmeldung (Baustelle mobil) -----------------------------

export async function meldeMaterialSchnellAction(formData: FormData) {
  const projektId = await getActiveProjectId()
  const materialId = requireField(formData, "materialId")
  const artRaw = requireField(formData, "art")
  if (!MATERIAL_SCHNELL_ARTEN.includes(artRaw as MaterialSchnellArt)) {
    throw new Error("Unknown quick material report type.")
  }
  const art = artRaw as MaterialSchnellArt
  const notiz = optionalField(formData, "notiz")

  const data = await loadData(projektId)
  const material = data.materialien.find((item) => item.id === materialId)
  if (!material) {
    throw new Error("Material not found.")
  }

  const ctx = createMutationContext({
    actor: "Site (mobile)",
    quelle: "ui",
    geraet: optionalField(formData, "geraet") === "mobil" ? "mobil" : "desktop",
  })
  const result = meldeMaterialSchnell({ projektId, material, art, notiz }, ctx)
  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)
}

// --- Entscheidung treffen --------------------------------------------------

export async function createEntscheidungAction(formData: FormData) {
  const projektId = await getActiveProjectId()
  const konfliktId = requireField(formData, "konfliktId")
  const titel = requireField(formData, "titel")
  const begruendung = requireField(formData, "begruendung")
  const entschiedenVon = optionalField(formData, "entschiedenVon") ?? "Planning"
  const folgenRaw = optionalField(formData, "folgenFuerBetrieb")
  const folgenFuerBetrieb = folgenRaw
    ? folgenRaw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : []
  const neuerStatusRaw = optionalField(formData, "neuerKonfliktStatus")
  const neuerKonfliktStatus = KONFLIKT_STATUS.includes(
    neuerStatusRaw as ConflictStatus
  )
    ? (neuerStatusRaw as ConflictStatus)
    : undefined

  const data = await loadData(projektId)
  const konflikt = data.konflikte.find((item) => item.id === konfliktId)
  if (!konflikt) {
    throw new Error("Conflict not found.")
  }

  const ctx = createMutationContext({ actor: entschiedenVon, quelle: "ui" })
  const result = createEntscheidung(
    {
      konflikt,
      titel,
      begruendung,
      entschiedenVon,
      folgenFuerBetrieb,
      neuerKonfliktStatus,
    },
    ctx
  )
  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)
}

export async function speicherePlanAbgleichAction(payload: {
  projectId: string
  standortId: string
  planversionId: string
  planversionLabel: string
  marker: PlanAbweichungMarker[]
}) {
  const projektId = payload.projectId || (await getActiveProjectId())
  const ctx = createMutationContext({
    actor: "Site management (plan comparison)",
    quelle: "ui",
  })
  const result = speicherePlanAbgleich(
    {
      projektId,
      standortId: payload.standortId,
      planversionId: payload.planversionId,
      planversionLabel: payload.planversionLabel,
      marker: payload.marker,
    },
    ctx
  )
  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)
  return {
    message: result.upserts.konflikte?.length
      ? "Deviations saved: conflict and cost forecast created."
      : "Plan comparison logged without deviations.",
    konfliktErstellt: Boolean(result.upserts.konflikte?.length),
  }
}

// --- Asset an Betrieb übergeben --------------------------------------------

export async function uebergebeAssetAction(formData: FormData) {
  const projektId = await getActiveProjectId()
  const assetId = requireField(formData, "assetId")

  const data = await loadData(projektId)
  const asset = data.assets.find((item) => item.id === assetId)
  if (!asset) {
    throw new Error("Asset not found.")
  }

  const ctx = createMutationContext({
    actor: optionalField(formData, "actor") ?? "Bauleitung",
    quelle: "ui",
  })
  const result = uebergebeAsset({ asset, status: "uebergeben" }, ctx)
  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)
}

// --- Lagerbestand aktualisieren --------------------------------------------

export async function aktualisiereLagerBestandAction(
  artikelId: string,
  neuerBestand: number
): Promise<{ gespeicherterBestand: number; ueberbestandVersucht: boolean }> {
  const projektId = await getActiveProjectId()

  if (!Number.isFinite(neuerBestand) || neuerBestand < 0) {
    throw new Error("Ungültiger Bestand.")
  }

  const ctx = createMutationContext({
    actor: "Lager (Worker)",
    quelle: "ui",
    geraet: "desktop",
  })

  // Prefer an atomic DB update in Supabase mode to avoid lost updates and
  // reduce latency (fetching full stock list on each click was slow).
  if (getDataSourceMode() === "supabase" && hasSupabasePublicEnv()) {
    const supabase = await createClient()
    const MAX_RETRIES = 6

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const current = await supabase
        .from("lager_artikel")
        .select("*")
        .eq("id", artikelId)
        .single()

      if (current.error || !current.data) {
        throw new Error("Lagerartikel nicht gefunden.")
      }

      const artikel = mapLagerArtikel(
        current.data as Parameters<typeof mapLagerArtikel>[0]
      )

      const result = aktualisiereLagerArtikel({ projektId, artikel, neuerBestand }, ctx)

      const updated = await supabase
        .from("lager_artikel")
        .update({ aktuell: result.gespeicherterBestand })
        .eq("id", artikelId)
        .eq("updated_at", current.data.updated_at)
        .select("*")
        .maybeSingle()

      // No row updated -> concurrent write; retry with fresh row.
      if (!updated.data) {
        continue
      }

      // Apply only the side effects (activities/audit) via mutation pipeline.
      // The stock row itself is already written atomically above.
      await repository.applyMutation(projektId, {
        ...result,
        upserts: { ...result.upserts, lagerArtikel: [] },
      })
      revalidateProject(projektId)

      return {
        gespeicherterBestand: result.gespeicherterBestand,
        ueberbestandVersucht: result.ueberbestandVersucht,
      }
    }

    throw new Error("Bestand konnte nicht gespeichert werden (Konflikt).")
  }

  const { data } = await repository.getLagerBestand(projektId)
  const artikel = data.artikel.find((item) => item.id === artikelId)
  if (!artikel) {
    throw new Error("Lagerartikel nicht gefunden.")
  }

  const result = aktualisiereLagerArtikel({ projektId, artikel, neuerBestand }, ctx)
  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)

  return {
    gespeicherterBestand: result.gespeicherterBestand,
    ueberbestandVersucht: result.ueberbestandVersucht,
  }
}

export async function bestaetigeVisionLagerBestandAction(
  artikelId: string,
  neuerBestand: number
): Promise<{
  gespeicherterBestand: number
  ueberbestandVersucht: boolean
  unchanged: boolean
}> {
  const projektId = await getActiveProjectId()

  if (!Number.isFinite(neuerBestand) || neuerBestand < 0) {
    throw new Error("Ungültiger Bestand.")
  }

  const { data } = await repository.getLagerBestand(projektId)
  const artikel = data.artikel.find((item) => item.id === artikelId)
  if (!artikel) {
    throw new Error("Lagerartikel nicht gefunden.")
  }

  if (artikel.aktuell === neuerBestand) {
    return {
      gespeicherterBestand: artikel.aktuell,
      ueberbestandVersucht: false,
      unchanged: true,
    }
  }

  const ctx = createMutationContext({
    actor: "Lager Vision",
    quelle: "vision",
    geraet: "mobil",
  })

  const result = aktualisiereLagerArtikel(
    { projektId, artikel, neuerBestand },
    ctx
  )
  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)

  return {
    gespeicherterBestand: result.gespeicherterBestand,
    ueberbestandVersucht: result.ueberbestandVersucht,
    unchanged: false,
  }
}

function parseErkennungsbegriffe(value: string | undefined): string[] {
  if (!value) {
    return []
  }

  return value
    .split(/[,;]+/)
    .map((term) => term.trim())
    .filter(Boolean)
}

function parsePositiveNumber(value: string, label: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Ungültiger Wert für ${label}.`)
  }
  return parsed
}

export async function erstelleLagerArtikelAction(
  formData: FormData
): Promise<{ artikelId: string }> {
  const projektId = await getActiveProjectId()
  const name = requireField(formData, "name")
  const maximal = parsePositiveNumber(requireField(formData, "maximal"), "Geplant")
  const aktuell = optionalField(formData, "aktuell")
  const erkennungsbegriffe = parseErkennungsbegriffe(
    optionalField(formData, "erkennungsbegriffe")
  )

  const ctx = createMutationContext({
    actor: "Lager (Worker)",
    quelle: "ui",
    geraet: "desktop",
  })

  const result = erstelleLagerArtikel(
    {
      projektId,
      name,
      maximal,
      mindestbestand: 0,
      aktuell: aktuell ? parsePositiveNumber(aktuell, "Aktueller Bestand") : 0,
      erkennungsbegriffe,
    },
    ctx
  )

  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)

  const artikel = result.upserts.lagerArtikel?.[0]
  if (!artikel) {
    throw new Error("Lagerartikel konnte nicht angelegt werden.")
  }

  return { artikelId: artikel.id }
}

export async function bearbeiteLagerArtikelAction(
  artikelId: string,
  formData: FormData
): Promise<LagerArtikel> {
  const projektId = await getActiveProjectId()
  const name = requireField(formData, "name")
  const maximal = parsePositiveNumber(requireField(formData, "maximal"), "Geplant")
  const erkennungsbegriffe = parseErkennungsbegriffe(
    optionalField(formData, "erkennungsbegriffe")
  )

  const { data } = await repository.getLagerBestand(projektId)
  const artikel = data.artikel.find((item) => item.id === artikelId)
  if (!artikel) {
    throw new Error("Lagerartikel nicht gefunden.")
  }

  const ctx = createMutationContext({
    actor: "Lager (Worker)",
    quelle: "ui",
    geraet: "desktop",
  })

  const result = bearbeiteLagerArtikel(
    {
      projektId,
      artikel,
      name,
      maximal,
      mindestbestand: 0,
      erkennungsbegriffe,
    },
    ctx
  )

  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)

  const updated = result.upserts.lagerArtikel?.[0]
  if (!updated) {
    throw new Error("Lagerartikel konnte nicht aktualisiert werden.")
  }

  return updated
}

export async function loescheLagerArtikelAction(
  artikelId: string
): Promise<{ artikelId: string }> {
  const projektId = await getActiveProjectId()

  const { data } = await repository.getLagerBestand(projektId)
  const artikel = data.artikel.find((item) => item.id === artikelId)
  if (!artikel) {
    throw new Error("Lagerartikel nicht gefunden.")
  }

  const ctx = createMutationContext({
    actor: "Lager (Worker)",
    quelle: "ui",
    geraet: "desktop",
  })

  const result = loescheLagerArtikel({ projektId, artikel }, ctx)
  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)

  return { artikelId }
}

export interface VisionLagerBestandUpdate {
  artikelId: string
  neuerBestand: number
}

export async function bestaetigeMehrereVisionLagerBestaendeAction(
  updates: VisionLagerBestandUpdate[]
): Promise<{
  gespeichert: Array<{
    artikelId: string
    gespeicherterBestand: number
    ueberbestandVersucht: boolean
    unchanged: boolean
  }>
}> {
  const projektId = await getActiveProjectId()

  if (updates.length === 0) {
    throw new Error("Keine Bestandsänderungen übergeben.")
  }

  const { data } = await repository.getLagerBestand(projektId)
  const gespeichert: Array<{
    artikelId: string
    gespeicherterBestand: number
    ueberbestandVersucht: boolean
    unchanged: boolean
  }> = []

  for (const update of updates) {
    if (!Number.isFinite(update.neuerBestand) || update.neuerBestand < 0) {
      throw new Error("Ungültiger Bestand.")
    }

    const artikel = data.artikel.find((item) => item.id === update.artikelId)
    if (!artikel) {
      throw new Error(`Lagerartikel nicht gefunden: ${update.artikelId}`)
    }

    if (artikel.aktuell === update.neuerBestand) {
      gespeichert.push({
        artikelId: artikel.id,
        gespeicherterBestand: artikel.aktuell,
        ueberbestandVersucht: false,
        unchanged: true,
      })
      continue
    }

    const ctx = createMutationContext({
      actor: "Lager Vision",
      quelle: "vision",
      geraet: "mobil",
    })

    const result = aktualisiereLagerArtikel(
      { projektId, artikel, neuerBestand: update.neuerBestand },
      ctx
    )
    await repository.applyMutation(projektId, result)

    gespeichert.push({
      artikelId: artikel.id,
      gespeicherterBestand: result.gespeicherterBestand,
      ueberbestandVersucht: result.ueberbestandVersucht,
      unchanged: false,
    })
  }

  revalidateProject(projektId)
  return { gespeichert }
}
