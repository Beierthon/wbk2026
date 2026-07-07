import { WBK_DEMO_DATA } from "@workspace/domain/demo-data"

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
  ProjectRepository,
  RepositoryMeta,
  RepositoryResult,
} from "./types"

function createMeta(): RepositoryMeta {
  return {
    source: "mock",
    generatedAt: new Date().toISOString(),
    realtime: {
      enabled: false,
      channel: "mock:project-dashboard",
    },
  }
}

function ok<T>(data: T): RepositoryResult<T> {
  return {
    data,
    meta: createMeta(),
    error: null,
  }
}

export const mockProjectRepository: ProjectRepository = {
  async listProjects() {
    return ok(WBK_DEMO_DATA.projekte)
  },

  async getDashboardData(projectId) {
    const projekt = WBK_DEMO_DATA.projekte.find((item) => item.id === projectId)

    if (!projekt) {
      throw new RepositoryError("Projekt wurde in den Demo-Daten nicht gefunden.", 404)
    }

    const standort = WBK_DEMO_DATA.standorte.find(
      (item) => item.id === projekt.standortId
    )

    if (!standort) {
      throw new RepositoryError("Standort wurde in den Demo-Daten nicht gefunden.", 500)
    }

    const dashboardData: ProjectDashboardData = {
      projekt,
      standort,
      planstaende: WBK_DEMO_DATA.planstaende.filter(
        (item) => item.projektId === projectId
      ),
      planversionen: WBK_DEMO_DATA.planversionen,
      konflikte: WBK_DEMO_DATA.konflikte.filter(
        (item) => item.projektId === projectId
      ),
      kommentare: WBK_DEMO_DATA.kommentare.filter(
        (item) => item.projektId === projectId
      ),
      entscheidungen: WBK_DEMO_DATA.entscheidungen.filter(
        (item) => item.projektId === projectId
      ),
      materialien: WBK_DEMO_DATA.materialien.filter(
        (item) => item.projektId === projectId
      ),
      bestellungen: WBK_DEMO_DATA.bestellungen.filter(
        (item) => item.projektId === projectId
      ),
      assets: WBK_DEMO_DATA.assets.filter((item) => item.projektId === projectId),
      aktivitaeten: WBK_DEMO_DATA.aktivitaeten.filter(
        (item) => item.projektId === projectId
      ),
      externeReferenzen: WBK_DEMO_DATA.externeReferenzen.filter(
        (item) => item.projektId === projectId
      ),
      kostenprognosen: WBK_DEMO_DATA.kostenprognosen.filter(
        (item) => item.projektId === projectId
      ),
    }

    return ok(dashboardData)
  },

  async getBauUebersicht(projectId) {
    const dashboard = await mockProjectRepository.getDashboardData(projectId)
    const { data } = dashboard

    const materialien: MaterialWithBestellung[] = data.materialien.map(
      (material) => {
        const bestellung = data.bestellungen.find(
          (item) => item.materialId === material.id
        )
        const externeReferenz = bestellung?.externeReferenzId
          ? data.externeReferenzen.find(
              (item) => item.id === bestellung.externeReferenzId
            )
          : undefined

        return { material, bestellung, externeReferenz }
      }
    )

    const bauUebersicht: BauUebersicht = {
      projekt: data.projekt,
      standort: data.standort,
      materialien,
      konflikte: data.konflikte.filter(
        (konflikt) =>
          konflikt.quelle === "bau" || konflikt.zielDomaene === "planung"
      ),
      kommentare: data.kommentare.filter(
        (kommentar) => kommentar.rolle === "bau"
      ),
      aktivitaeten: data.aktivitaeten.filter(
        (aktivitaet) =>
          aktivitaet.quelle === "bau" ||
          aktivitaet.ziel === "bau" ||
          aktivitaet.art === "konflikt_gemeldet"
      ),
      externeReferenzen: data.externeReferenzen,
    }

    return ok(bauUebersicht)
  },

  async getPlanungsUebersicht(projectId) {
    const dashboard = await mockProjectRepository.getDashboardData(projectId)
    const { data } = dashboard

    const planstaende: PlanstandMitVersionen[] = data.planstaende.map(
      (planstand) => {
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
      }
    )

    const planungsUebersicht: PlanungsUebersicht = {
      projekt: data.projekt,
      standort: data.standort,
      planstaende,
      konflikte: data.konflikte.filter(
        (konflikt) =>
          konflikt.quelle === "planung" || konflikt.zielDomaene === "planung"
      ),
      kommentare: data.kommentare.filter(
        (kommentar) => kommentar.rolle === "planung"
      ),
      entscheidungen: data.entscheidungen,
    }

    return ok(planungsUebersicht)
  },

  async getBetriebUebersicht(projectId) {
    const dashboard = await mockProjectRepository.getDashboardData(projectId)
    const { data } = dashboard

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

    const betriebUebersicht: BetriebUebersicht = {
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
    }

    return ok(betriebUebersicht)
  },

  async getAktivitaetsUebersicht(projectId) {
    const dashboard = await mockProjectRepository.getDashboardData(projectId)
    const { data } = dashboard

    const aktivitaeten = [...data.aktivitaeten].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )

    const aktivitaetsUebersicht: AktivitaetsUebersicht = {
      projekt: data.projekt,
      standort: data.standort,
      aktivitaeten,
    }

    return ok(aktivitaetsUebersicht)
  },

  async getAnalyticsUebersicht(projectId) {
    const dashboard = await mockProjectRepository.getDashboardData(projectId)
    const { data } = dashboard

    const aktivitaeten = data.aktivitaeten
      .filter(
        (aktivitaet) =>
          aktivitaet.art === "material_aktualisiert" ||
          aktivitaet.quelle === "mock" ||
          Boolean(aktivitaet.bezug.konfliktId)
      )
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      )

    const analyticsUebersicht: AnalyticsUebersicht = {
      projekt: data.projekt,
      standort: data.standort,
      kostenprognosen: data.kostenprognosen,
      materialien: data.materialien,
      konflikte: data.konflikte,
      aktivitaeten,
    }

    return ok(analyticsUebersicht)
  },

  async getKostenprognosenUebersicht(projectId) {
    const dashboard = await mockProjectRepository.getDashboardData(projectId)
    const { data } = dashboard

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

    const kostenprognosenUebersicht: KostenprognosenUebersicht = {
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

    return ok(kostenprognosenUebersicht)
  },
}
