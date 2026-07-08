import { applyMutationToStore } from "./apply-mutation"
import { loadProjectDashboardData } from "./cached-dashboard"
import { enrichLagerArtikelWithLieferanten } from "@/lib/lager/lieferant"
import { getMockStore } from "./mock-store"
import {
  buildAktivitaetsUebersicht,
  buildAnalyticsUebersicht,
  buildBauUebersicht,
  buildBetriebUebersicht,
  buildKostenprognosenUebersicht,
  buildPlanungsUebersicht,
  buildRoadmapUebersicht,
  buildStandortUebersicht,
} from "./project-overviews"
import type {
  ProjectRepository,
  RepositoryMeta,
  RepositoryResult,
} from "./types"

function createMeta(): RepositoryMeta {
  return {
    source: "mock",
    generatedAt: "",
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
    return ok(getMockStore().projekte)
  },

  async getDashboardData(projectId) {
    return ok(await loadProjectDashboardData(projectId))
  },

  async getBauUebersicht(projectId) {
    return ok(buildBauUebersicht(await loadProjectDashboardData(projectId)))
  },

  async getPlanungsUebersicht(projectId) {
    return ok(
      buildPlanungsUebersicht(await loadProjectDashboardData(projectId))
    )
  },

  async getBetriebUebersicht(projectId) {
    return ok(buildBetriebUebersicht(await loadProjectDashboardData(projectId)))
  },

  async getAktivitaetsUebersicht(projectId) {
    return ok(
      buildAktivitaetsUebersicht(await loadProjectDashboardData(projectId))
    )
  },

  async getAnalyticsUebersicht(projectId) {
    return ok(
      buildAnalyticsUebersicht(await loadProjectDashboardData(projectId))
    )
  },

  async getKostenprognosenUebersicht(projectId) {
    return ok(
      buildKostenprognosenUebersicht(await loadProjectDashboardData(projectId))
    )
  },

  async getStandortUebersicht(projectId) {
    return ok(
      buildStandortUebersicht(await loadProjectDashboardData(projectId))
    )
  },

  async getRoadmapUebersicht(projectId) {
    return ok(buildRoadmapUebersicht(await loadProjectDashboardData(projectId)))
  },

  async getLagerBestand(projectId) {
    const store = getMockStore()
    const lieferanten = store.lieferanten.filter(
      (item) => item.projektId === projectId
    )
    const artikel = enrichLagerArtikelWithLieferanten(
      store.lagerArtikel.filter((item) => item.projektId === projectId),
      lieferanten
    )
    const aktivitaeten = store.aktivitaeten.filter(
      (item) => item.projektId === projectId
    )
    return ok({ artikel, lieferanten, aktivitaeten })
  },

  async applyMutation(_projectId, result) {
    applyMutationToStore(getMockStore(), result)
    return ok(undefined)
  },
}
