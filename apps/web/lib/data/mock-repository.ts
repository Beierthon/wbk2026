import type { BauprojektDatenmodell, MutationResult } from "@workspace/domain"
import { cache } from "react"

import { RepositoryError } from "./errors"
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
import type {
  ProjectRepository,
  ProjectDashboardData,
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

// Per-Request dedupliziert (#92/#93). Liest aus dem mutierbaren Mock-Store,
// damit Schreib-Flows nach revalidatePath sichtbar sind.
const loadProjectDashboardData = cache(async function loadProjectDashboardData(
  projectId: string
): Promise<ProjectDashboardData> {
  const store = getMockStore()
  const projekt = store.projekte.find((item) => item.id === projectId)

  if (!projekt) {
    throw new RepositoryError("Projekt wurde in den Demo-Daten nicht gefunden.", 404)
  }

  const standort = store.standorte.find((item) => item.id === projekt.standortId)

  if (!standort) {
    throw new RepositoryError("Standort wurde in den Demo-Daten nicht gefunden.", 500)
  }

  const byProject = <T extends { projektId: string }>(items: T[]) =>
    items.filter((item) => item.projektId === projectId)

  const planstaende = byProject(store.planstaende)
  const planstandIds = new Set(planstaende.map((item) => item.id))

  return {
    projekt,
    standort,
    planstaende,
    planversionen: store.planversionen.filter((item) =>
      planstandIds.has(item.planstandId)
    ),
    konflikte: byProject(store.konflikte),
    kommentare: byProject(store.kommentare),
    planMarkers: byProject(store.planMarkers),
    entscheidungen: byProject(store.entscheidungen),
    materialien: byProject(store.materialien),
    bestellungen: byProject(store.bestellungen),
    assets: byProject(store.assets),
    aktivitaeten: byProject(store.aktivitaeten),
    externeReferenzen: byProject(store.externeReferenzen),
    kostenprognosen: byProject(store.kostenprognosen),
    wartungsaufgaben: byProject(store.wartungsaufgaben),
    auditEintraege: byProject(store.auditEintraege),
  }
})

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
