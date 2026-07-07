import { formatEuroFromCent } from "@/components/dashboard/formatters"
import { RepositoryError } from "./errors"
import type {
  AktivitaetsUebersicht,
  AnalyticsUebersicht,
  AssetMitKontext,
  BauUebersicht,
  BetriebUebersicht,
  KostenprognoseMitKontext,
  KostenprognosenUebersicht,
  MaterialWithBestellung,
  PlanstandMitVersionen,
  PlanungsUebersicht,
  ProjectDashboardData,
  StandortUebersicht,
} from "./types"

export function buildBauUebersicht(data: ProjectDashboardData): BauUebersicht {
  const materialien: MaterialWithBestellung[] = data.materialien.map((material) => {
    const bestellung = data.bestellungen.find(
      (item) => item.materialId === material.id
    )
    const externeReferenz = bestellung?.externeReferenzId
      ? data.externeReferenzen.find((item) => item.id === bestellung.externeReferenzId)
      : undefined

    return { material, bestellung, externeReferenz }
  })

  return {
    projekt: data.projekt,
    standort: data.standort,
    materialien,
    konflikte: data.konflikte.filter(
      (konflikt) =>
        konflikt.quelle === "bau" || konflikt.zielDomaene === "planung"
    ),
    kommentare: data.kommentare.filter((kommentar) => kommentar.rolle === "bau"),
    aktivitaeten: data.aktivitaeten.filter(
      (aktivitaet) =>
        aktivitaet.quelle === "bau" ||
        aktivitaet.ziel === "bau" ||
        aktivitaet.art === "konflikt_gemeldet" ||
        aktivitaet.art === "erp_eap_sync"
    ),
    externeReferenzen: data.externeReferenzen,
  }
}

export function buildPlanungsUebersicht(
  data: ProjectDashboardData
): PlanungsUebersicht {
  const planstaende: PlanstandMitVersionen[] = data.planstaende.map((planstand) => {
    const versionen = data.planversionen.filter(
      (version) => version.planstandId === planstand.id
    )
    const aktuelleVersion = versionen.find(
      (version) => version.id === planstand.aktuelleVersionId
    )

    if (!aktuelleVersion) {
      throw new RepositoryError(
        `Aktuelle Planversion fuer ${planstand.id} nicht gefunden.`,
        500
      )
    }

    return {
      ...planstand,
      versionen,
      aktuelleVersion,
    }
  })

  return {
    projekt: data.projekt,
    standort: data.standort,
    planstaende,
    planMarker: data.planMarker,
    konflikte: data.konflikte.filter(
      (konflikt) =>
        konflikt.quelle === "planung" || konflikt.zielDomaene === "planung"
    ),
    kommentare: data.kommentare.filter(
      (kommentar) => kommentar.rolle === "planung"
    ),
    entscheidungen: data.entscheidungen,
  }
}

export function buildBetriebUebersicht(
  data: ProjectDashboardData
): BetriebUebersicht {
  const materialById = new Map(
    data.materialien.map((material) => [material.id, material])
  )
  const planversionById = new Map(
    data.planversionen.map((planversion) => [planversion.id, planversion])
  )

  const assets: AssetMitKontext[] = data.assets.map((asset) => ({
    ...asset,
    materialName: asset.materialId
      ? materialById.get(asset.materialId)?.name
      : undefined,
    planversionLabel: asset.planversionId
      ? planversionById.get(asset.planversionId)?.version
      : undefined,
  }))

  const aktivitaeten = data.aktivitaeten
    .filter(
      (aktivitaet) =>
        aktivitaet.quelle === "betrieb" ||
        aktivitaet.ziel === "betrieb" ||
        aktivitaet.art === "asset_uebergeben"
    )
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )

  const planversionIds = new Set(
    assets
      .map((asset) => asset.planversionId)
      .filter((id): id is string => Boolean(id))
  )

  const uebergabedokumente = data.dateien.filter(
    (datei) =>
      datei.bucket === "uebergabeberichte" ||
      datei.quelle === "betrieb" ||
      Boolean(datei.assetId)
  )

  return {
    projekt: data.projekt,
    standort: data.standort,
    assets,
    entscheidungen: data.entscheidungen,
    aktivitaeten,
    planversionen: data.planversionen.filter((planversion) =>
      planversionIds.has(planversion.id)
    ),
    materialien: data.materialien.filter((material) =>
      assets.some((asset) => asset.materialId === material.id)
    ),
    uebergabedokumente,
  }
}

export function buildAktivitaetsUebersicht(
  data: ProjectDashboardData
): AktivitaetsUebersicht {
  const planversionById = new Map(
    data.planversionen.map((planversion) => [planversion.id, planversion])
  )
  const konfliktById = new Map(
    data.konflikte.map((konflikt) => [konflikt.id, konflikt])
  )
  const materialById = new Map(
    data.materialien.map((material) => [material.id, material])
  )
  const assetById = new Map(data.assets.map((asset) => [asset.id, asset]))
  const entscheidungById = new Map(
    data.entscheidungen.map((entscheidung) => [entscheidung.id, entscheidung])
  )
  const kostenprognoseById = new Map(
    data.kostenprognosen.map((prognose) => [prognose.id, prognose])
  )

  const aktivitaeten = [...data.aktivitaeten]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
    .map((aktivitaet) => ({
      ...aktivitaet,
      bezugLabels: {
        planversion: aktivitaet.bezug.planversionId
          ? planversionById.get(aktivitaet.bezug.planversionId)?.version
          : undefined,
        konflikt: aktivitaet.bezug.konfliktId
          ? konfliktById.get(aktivitaet.bezug.konfliktId)?.titel
          : undefined,
        material: aktivitaet.bezug.materialId
          ? materialById.get(aktivitaet.bezug.materialId)?.name
          : undefined,
        asset: aktivitaet.bezug.assetId
          ? assetById.get(aktivitaet.bezug.assetId)?.name
          : undefined,
        entscheidung: aktivitaet.bezug.entscheidungId
          ? entscheidungById.get(aktivitaet.bezug.entscheidungId)?.titel
          : undefined,
        kostenprognose: aktivitaet.bezug.kostenprognoseId
          ? (() => {
              const prognose = kostenprognoseById.get(
                aktivitaet.bezug.kostenprognoseId
              )
              return prognose
                ? formatEuroFromCent(prognose.gesamtMehrkostenCent)
                : undefined
            })()
          : undefined,
      },
    }))

  const auditEintraege = [...data.auditEintraege].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )

  return {
    projekt: data.projekt,
    standort: data.standort,
    aktivitaeten,
    auditEintraege,
  }
}

export function buildAnalyticsUebersicht(
  data: ProjectDashboardData
): AnalyticsUebersicht {
  const aktivitaeten = data.aktivitaeten
    .filter(
      (aktivitaet) =>
        aktivitaet.art === "material_aktualisiert" ||
        aktivitaet.quelle === "mock" ||
        aktivitaet.quelle === "vision" ||
        aktivitaet.quelle === "eap" ||
        aktivitaet.quelle === "erp" ||
        Boolean(aktivitaet.bezug.konfliktId)
    )
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )

  return {
    projekt: data.projekt,
    standort: data.standort,
    kostenprognosen: data.kostenprognosen,
    materialien: data.materialien,
    konflikte: data.konflikte,
    aktivitaeten,
  }
}

export function buildKostenprognosenUebersicht(
  data: ProjectDashboardData
): KostenprognosenUebersicht {
  const konfliktById = new Map(
    data.konflikte.map((konflikt) => [konflikt.id, konflikt])
  )

  const kostenprognosen: KostenprognoseMitKontext[] = data.kostenprognosen
    .map((prognose) => ({
      ...prognose,
      konfliktTitel: prognose.konfliktId
        ? konfliktById.get(prognose.konfliktId)?.titel
        : undefined,
    }))
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )

  return {
    projekt: data.projekt,
    standort: data.standort,
    kostenprognosen,
    gesamtMehrkostenCent: kostenprognosen.reduce(
      (sum, prognose) => sum + prognose.gesamtMehrkostenCent,
      0
    ),
    gesamtZeitwirkungTage: kostenprognosen.reduce(
      (sum, prognose) => sum + prognose.zeitwirkungTage,
      0
    ),
  }
}

export function buildStandortUebersicht(
  data: ProjectDashboardData
): StandortUebersicht {
  const konflikte = data.konflikte.filter(
    (konflikt) => konflikt.standortId === data.standort.id
  )

  const konfliktIds = new Set(konflikte.map((konflikt) => konflikt.id))
  const konfliktById = new Map(
    konflikte.map((konflikt) => [konflikt.id, konflikt])
  )

  const kostenprognosen: KostenprognoseMitKontext[] = data.kostenprognosen
    .filter(
      (prognose) => prognose.konfliktId && konfliktIds.has(prognose.konfliktId)
    )
    .map((prognose) => ({
      ...prognose,
      konfliktTitel: prognose.konfliktId
        ? konfliktById.get(prognose.konfliktId)?.titel
        : undefined,
    }))
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )

  return {
    projekt: data.projekt,
    standort: data.standort,
    konflikte,
    kostenprognosen,
  }
}
