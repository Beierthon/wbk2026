"use server"

import {
  createEntscheidung,
  createKommentar,
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
} from "@workspace/domain"
import { invalidateProjectCache } from "@/lib/cache/invalidate"
import { getProjectRepository } from "@/lib/data"
import { WBK_DEMO_PROJECT_ID } from "@/lib/project"

import { createMutationContext, optionalField, requireField } from "./context"

const repository = getProjectRepository()

function activeProjectId(): string {
  return WBK_DEMO_PROJECT_ID
}

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

function parsePhase(value: string, fallback: ProjectPhase): ProjectPhase {
  return PHASEN.includes(value as ProjectPhase)
    ? (value as ProjectPhase)
    : fallback
}

// --- Planung: neue Planversion veröffentlichen -----------------------------

export async function publishPlanversionAction(formData: FormData) {
  const projektId = activeProjectId()
  const planstandId = requireField(formData, "planstandId")
  const version = requireField(formData, "version")
  const aenderungsnotiz = requireField(formData, "aenderungsnotiz")
  const veroeffentlichtVon =
    optionalField(formData, "veroeffentlichtVon") ?? "Planung"

  const data = await loadData(projektId)
  const planstand = data.planstaende.find((item) => item.id === planstandId)
  if (!planstand) {
    throw new Error("Planstand nicht gefunden.")
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
  const projektId = activeProjectId()
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
    optionalField(formData, "verantwortlich") ?? "Bauleitung"
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
    const bauabschnitt = refreshed.bauabschnitte.find((a) => a.id === bauabschnittId)
    const konflikt = result.upserts.konflikte?.[0]
    const aktivesSzenario =
      refreshed.terminplanSzenarien.find((s) => s.istAktiv) ??
      refreshed.terminplanSzenarien[0]

    if (bauabschnitt && konflikt && aktivesSzenario) {
      const { blockiereBauabschnitt, verschiebeBauabschnitt } = await import(
        "@workspace/domain"
      )
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
  const projektId = activeProjectId()
  const text = requireField(formData, "text")
  const autor = optionalField(formData, "autor") ?? "Projektbeteiligte"
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
  const projektId = activeProjectId()
  const konfliktId = requireField(formData, "konfliktId")
  const statusRaw = requireField(formData, "status")
  const status = KONFLIKT_STATUS.includes(statusRaw as ConflictStatus)
    ? (statusRaw as ConflictStatus)
    : undefined
  if (!status) {
    throw new Error("Unbekannter Konfliktstatus.")
  }
  const actorRolle = optionalField(formData, "actorRolle")

  const data = await loadData(projektId)
  const konflikt = data.konflikte.find((item) => item.id === konfliktId)
  if (!konflikt) {
    throw new Error("Konflikt nicht gefunden.")
  }

  const ctx = createMutationContext({
    actor: optionalField(formData, "actor") ?? "Projektsteuerung",
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
  const projektId = activeProjectId()
  const materialId = requireField(formData, "materialId")
  const artRaw = requireField(formData, "art")
  if (!MATERIAL_SCHNELL_ARTEN.includes(artRaw as MaterialSchnellArt)) {
    throw new Error("Unbekannte Material-Schnellmeldung.")
  }
  const art = artRaw as MaterialSchnellArt
  const notiz = optionalField(formData, "notiz")

  const data = await loadData(projektId)
  const material = data.materialien.find((item) => item.id === materialId)
  if (!material) {
    throw new Error("Material nicht gefunden.")
  }

  const ctx = createMutationContext({
    actor: "Baustelle (mobil)",
    quelle: "ui",
    geraet: optionalField(formData, "geraet") === "mobil" ? "mobil" : "desktop",
  })
  const result = meldeMaterialSchnell({ projektId, material, art, notiz }, ctx)
  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)
}

// --- Entscheidung treffen --------------------------------------------------

export async function createEntscheidungAction(formData: FormData) {
  const projektId = activeProjectId()
  const konfliktId = requireField(formData, "konfliktId")
  const titel = requireField(formData, "titel")
  const begruendung = requireField(formData, "begruendung")
  const entschiedenVon = optionalField(formData, "entschiedenVon") ?? "Planung"
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
    throw new Error("Konflikt nicht gefunden.")
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

const MARKER_TYPEN: PlanMarkerTyp[] = [
  "konflikt",
  "rueckfrage",
  "material",
  "sicherheit",
]

// --- Plan-Annotation (#24) -------------------------------------------------

export async function createPlanMarkerAction(formData: FormData) {
  const projektId = activeProjectId()
  const planversionId = requireField(formData, "planversionId")
  const typRaw = requireField(formData, "typ")
  if (!MARKER_TYPEN.includes(typRaw as PlanMarkerTyp)) {
    throw new Error("Unbekannter Marker-Typ.")
  }
  const typ = typRaw as PlanMarkerTyp
  const titel = requireField(formData, "titel")
  const beschreibung = requireField(formData, "beschreibung")
  const autor = optionalField(formData, "autor") ?? "Planung"
  const rolle = parsePhase(
    optionalField(formData, "rolle") ?? "planung",
    "planung"
  )
  const xPercent = Number(requireField(formData, "xPercent"))
  const yPercent = Number(requireField(formData, "yPercent"))

  if (Number.isNaN(xPercent) || Number.isNaN(yPercent)) {
    throw new Error("Ungültige Marker-Position.")
  }

  const prioritaetRaw = optionalField(formData, "prioritaet") ?? "mittel"
  const prioritaet = PRIORITAETEN.includes(prioritaetRaw as ConflictSeverity)
    ? (prioritaetRaw as ConflictSeverity)
    : "mittel"

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
  const projektId = payload.projectId || activeProjectId()
  const ctx = createMutationContext({ actor: "Bauleitung (Planabgleich)", quelle: "ui" })
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
      ? "Abweichungen gespeichert: Konflikt und Kostenprognose angelegt."
      : "Planabgleich ohne Abweichungen protokolliert.",
    konfliktErstellt: Boolean(result.upserts.konflikte?.length),
  }
}

// --- Asset an Betrieb übergeben --------------------------------------------

export async function uebergebeAssetAction(formData: FormData) {
  const projektId = activeProjectId()
  const assetId = requireField(formData, "assetId")

  const data = await loadData(projektId)
  const asset = data.assets.find((item) => item.id === assetId)
  if (!asset) {
    throw new Error("Asset nicht gefunden.")
  }

  const ctx = createMutationContext({
    actor: optionalField(formData, "actor") ?? "Bauleitung",
    quelle: "ui",
  })
  const result = uebergebeAsset({ asset, status: "uebergeben" }, ctx)
  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)
}
