import type { BauprojektDatenmodell, MutationResult } from "@workspace/domain"

import { loadProjectDashboardData } from "./cached-dashboard"
import { getMockStore, upsertById } from "./mock-store"
import {
  buildAktivitaetsUebersicht,
  buildAnalyticsUebersicht,
  buildBauUebersicht,
  buildBetriebUebersicht,
  buildKostenprognosenUebersicht,
  buildPlanungsUebersicht,
  buildStandortUebersicht,
} from "./project-overviews"
import type { ProjectRepository, RepositoryMeta, RepositoryResult } from "./types"

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

function applyMutationToStore(
  store: BauprojektDatenmodell,
  result: MutationResult
): void {
  const upserts = result.upserts
  for (const key of Object.keys(upserts) as (keyof BauprojektDatenmodell)[]) {
    const items = upserts[key]
    if (items && items.length > 0) {
      upsertById(store[key] as { id: string }[], items as { id: string }[])
    }
  }

  store.aktivitaeten.push(result.aktivitaet)
  if (result.auditEintraege.length > 0) {
    store.auditEintraege.push(...result.auditEintraege)
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
    return ok(buildPlanungsUebersicht(await loadProjectDashboardData(projectId)))
  },

  async getBetriebUebersicht(projectId) {
    return ok(buildBetriebUebersicht(await loadProjectDashboardData(projectId)))
  },

  async getAktivitaetsUebersicht(projectId) {
    return ok(buildAktivitaetsUebersicht(await loadProjectDashboardData(projectId)))
  },

  async getAnalyticsUebersicht(projectId) {
    return ok(buildAnalyticsUebersicht(await loadProjectDashboardData(projectId)))
  },

  async getKostenprognosenUebersicht(projectId) {
    return ok(
      buildKostenprognosenUebersicht(await loadProjectDashboardData(projectId))
    )
  },

  async getStandortUebersicht(projectId) {
    return ok(buildStandortUebersicht(await loadProjectDashboardData(projectId)))
  },

  async applyMutation(_projectId, result) {
    applyMutationToStore(getMockStore(), result)
    return ok(undefined)
  },
}
