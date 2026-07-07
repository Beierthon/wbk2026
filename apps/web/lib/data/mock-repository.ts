import { WBK_DEMO_DATA } from "@workspace/domain/demo-data"

import { RepositoryError } from "./errors"
import type {
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
}
