"use server"

import {
  blockiereBauabschnitt,
  erstelleKostenprognoseAusVerschiebung,
  loeseBlockierung,
  pruefeBestandUndVerschiebeTerminplan,
  verschiebeBauabschnitt,
  wechsleSzenario,
  type VerschiebungsStrategie,
  type VerschiebungsUrsache,
} from "@workspace/domain"
import { wendeVerschiebungsStrategie } from "@workspace/domain/terminplan"
import { berechneKostenprognose } from "@/lib/kalkulation/prognose-engine"
import { invalidateProjectCache } from "@/lib/cache/invalidate"
import { getProjectRepository } from "@/lib/data"
import { WBK_DEMO_PROJECT_ID } from "@/lib/project"

import { createMutationContext, optionalField, requireField } from "./context"

const repository = getProjectRepository()

const STRATEGIEN: VerschiebungsStrategie[] = [
  "manuell",
  "kaskade",
  "parallelisieren",
  "priorisieren",
  "scope_reduzieren",
  "ressourcen_umverteilen",
]

const URSACHEN: VerschiebungsUrsache[] = [
  "konflikt",
  "material_verzug",
  "mitarbeiter_ausfall",
  "wetter",
  "genehmigung",
  "manuell",
  "abhaengigkeit",
]

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

export async function previewVerschiebungAction(formData: FormData) {
  const projektId = activeProjectId()
  const data = await loadData(projektId)
  const bauabschnittId = requireField(formData, "bauabschnittId")
  const tage = Number(requireField(formData, "tage"))
  const strategieRaw = optionalField(formData, "strategie") ?? "manuell"
  const strategie = STRATEGIEN.includes(strategieRaw as VerschiebungsStrategie)
    ? (strategieRaw as VerschiebungsStrategie)
    : "manuell"
  const ursacheRaw = optionalField(formData, "ursache") ?? "manuell"
  const ursache = URSACHEN.includes(ursacheRaw as VerschiebungsUrsache)
    ? (ursacheRaw as VerschiebungsUrsache)
    : "manuell"

  const aktivesSzenario =
    data.terminplanSzenarien.find((s) => s.istAktiv) ?? data.terminplanSzenarien[0]
  const szenarioAbschnitte = data.bauabschnitte.filter(
    (a) => a.szenarioId === aktivesSzenario?.id
  )

  const vorschau = wendeVerschiebungsStrategie(
    {
      bauabschnittId,
      tage,
      strategie,
      ursache,
      grund: optionalField(formData, "grund") ?? "Vorschau",
      entschiedenVon: optionalField(formData, "entschiedenVon") ?? "Planung",
      konfliktId: optionalField(formData, "konfliktId"),
      materialId: optionalField(formData, "materialId"),
      mitarbeiterId: optionalField(formData, "mitarbeiterId"),
    },
    szenarioAbschnitte,
    data.bauabschnittAbhaengigkeiten,
    data.terminplanVerschiebungen,
    {
      mitarbeiterAusfaelle: data.mitarbeiterAusfaelle,
      bauabschnittMitarbeiter: data.bauabschnittMitarbeiter,
    }
  )

  const kosten = berechneKostenprognose({
    materialMehrmenge: 0,
    materialPreisProEinheitCent: 0,
    zusatzStunden: 0,
    stundensatzCent: 6800,
    verzugTage: tage,
    bauzeitKostenProTagCent: 450_000,
  })

  return {
    betroffeneAnzahl: vorschau.betroffeneAbschnitte.length,
    betroffeneTitel: vorschau.betroffeneAbschnitte.map((a) => a.titel),
    warnungen: vorschau.warnungen,
    geschaetzteMehrkostenCent: kosten.gesamtMehrkostenCent,
  }
}

export async function verschiebeBauabschnittAction(formData: FormData) {
  const projektId = activeProjectId()
  const data = await loadData(projektId)
  const bauabschnittId = requireField(formData, "bauabschnittId")
  const tage = Number(requireField(formData, "tage"))
  const strategieRaw = requireField(formData, "strategie")
  const ursacheRaw = requireField(formData, "ursache")
  const grund = requireField(formData, "grund")
  const entschiedenVon = optionalField(formData, "entschiedenVon") ?? "Planung"

  const strategie = STRATEGIEN.includes(strategieRaw as VerschiebungsStrategie)
    ? (strategieRaw as VerschiebungsStrategie)
    : "manuell"
  const ursache = URSACHEN.includes(ursacheRaw as VerschiebungsUrsache)
    ? (ursacheRaw as VerschiebungsUrsache)
    : "manuell"

  const aktivesSzenario =
    data.terminplanSzenarien.find((s) => s.istAktiv) ?? data.terminplanSzenarien[0]
  if (!aktivesSzenario) {
    throw new Error("Kein aktives Szenario gefunden.")
  }

  const szenarioAbschnitte = data.bauabschnitte.filter(
    (a) => a.szenarioId === aktivesSzenario.id
  )

  const kosten = berechneKostenprognose({
    materialMehrmenge: 0,
    materialPreisProEinheitCent: 0,
    zusatzStunden: 0,
    stundensatzCent: 6800,
    verzugTage: Math.max(0, tage),
    bauzeitKostenProTagCent: 450_000,
  })

  const ctx = createMutationContext({ actor: entschiedenVon, quelle: "ui" })
  const result = verschiebeBauabschnitt(
    {
      eingabe: {
        bauabschnittId,
        tage,
        strategie,
        ursache,
        grund,
        entschiedenVon,
        konfliktId: optionalField(formData, "konfliktId"),
        materialId: optionalField(formData, "materialId"),
        mitarbeiterId: optionalField(formData, "mitarbeiterId"),
      },
      szenarioId: aktivesSzenario.id,
      bauabschnitte: szenarioAbschnitte,
      abhaengigkeiten: data.bauabschnittAbhaengigkeiten,
      bisherigeVerschiebungen: data.terminplanVerschiebungen,
      kostenwirkungCent: kosten.gesamtMehrkostenCent,
    },
    ctx
  )

  if (tage > 0 && ursache === "konflikt") {
    const prognose = erstelleKostenprognoseAusVerschiebung(
      {
        projektId,
        konfliktId: optionalField(formData, "konfliktId"),
        verzugTage: tage,
        materialMehrkostenCent: kosten.materialMehrkostenCent,
        arbeitsMehrkostenCent: kosten.arbeitsMehrkostenCent,
        bauzeitMehrkostenCent: kosten.bauzeitMehrkostenCent,
        konfidenz: kosten.konfidenz,
        annahmen: [...kosten.annahmen, grund],
      },
      ctx
    )
    result.upserts.kostenprognosen = [
      ...(result.upserts.kostenprognosen ?? []),
      prognose,
    ]
  }

  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)
}

export async function wechsleSzenarioAction(formData: FormData) {
  const projektId = activeProjectId()
  const szenarioId = requireField(formData, "szenarioId")
  const data = await loadData(projektId)

  const ctx = createMutationContext({
    actor: optionalField(formData, "actor") ?? "Planung",
    quelle: "ui",
  })

  const result = wechsleSzenario(
    {
      projektId,
      szenarien: data.terminplanSzenarien,
      zielSzenarioId: szenarioId,
    },
    ctx
  )

  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)
}

export async function loeseBlockierungAction(formData: FormData) {
  const projektId = activeProjectId()
  const blockierungId = requireField(formData, "blockierungId")
  const data = await loadData(projektId)

  const blockierung = data.terminplanBlockierungen.find((b) => b.id === blockierungId)
  if (!blockierung) {
    throw new Error("Blockierung nicht gefunden.")
  }

  const bauabschnitt = data.bauabschnitte.find(
    (a) => a.id === blockierung.bauabschnittId
  )
  if (!bauabschnitt) {
    throw new Error("Bauabschnitt nicht gefunden.")
  }

  const ctx = createMutationContext({
    actor: optionalField(formData, "actor") ?? "Planung",
    quelle: "ui",
  })

  const result = loeseBlockierung(blockierung, bauabschnitt, ctx)
  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)
}

export async function blockiereAusKonfliktAction(formData: FormData) {
  const projektId = activeProjectId()
  const konfliktId = requireField(formData, "konfliktId")
  const bauabschnittId = requireField(formData, "bauabschnittId")
  const data = await loadData(projektId)

  const bauabschnitt = data.bauabschnitte.find((a) => a.id === bauabschnittId)
  if (!bauabschnitt) {
    throw new Error("Bauabschnitt nicht gefunden.")
  }

  const ctx = createMutationContext({
    actor: optionalField(formData, "actor") ?? "Planung",
    quelle: "ui",
  })

  const result = blockiereBauabschnitt(
    {
      projektId,
      bauabschnittId,
      blockiertDurchTyp: "konflikt",
      blockiertDurchId: konfliktId,
      blockiertSeit: new Date().toISOString().slice(0, 10),
      bauabschnitt,
    },
    ctx
  )

  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)
}

export async function pruefeBestandUndVerschiebeAction(formData: FormData) {
  const projektId = activeProjectId()
  const data = await loadData(projektId)
  const entschiedenVon = optionalField(formData, "entschiedenVon") ?? "Planung"

  const aktivesSzenario =
    data.terminplanSzenarien.find((s) => s.istAktiv) ?? data.terminplanSzenarien[0]
  if (!aktivesSzenario) {
    throw new Error("Kein aktives Szenario gefunden.")
  }

  const szenarioAbschnitte = data.bauabschnitte.filter(
    (a) => a.szenarioId === aktivesSzenario.id
  )

  const ctx = createMutationContext({ actor: entschiedenVon, quelle: "ui" })
  const result = pruefeBestandUndVerschiebeTerminplan(
    {
      projektId,
      szenarioId: aktivesSzenario.id,
      bauabschnitte: szenarioAbschnitte,
      abhaengigkeiten: data.bauabschnittAbhaengigkeiten,
      materialbedarf: data.bauabschnittMaterialbedarf,
      materialien: data.materialien,
      bestellungen: data.bestellungen,
      bisherigeVerschiebungen: data.terminplanVerschiebungen,
      bisherigeBlockierungen: data.terminplanBlockierungen,
      entschiedenVon,
    },
    ctx
  )

  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)
}
