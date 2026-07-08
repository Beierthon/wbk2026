import { cache } from "react"

import { getDataSourceMode } from "./config"
import { loadProjectDashboardData } from "./cached-dashboard"
import {
  loadWorkerAktivitaeten,
  loadWorkerLagerData,
  loadWorkerRealtimeContext,
} from "./lager-page-data"
import { buildBetriebUebersicht, buildPlanungsUebersicht } from "./project-overviews"
import { getProjectRepository } from "./repository"
import type { BetriebUebersicht, PlanungsUebersicht } from "./types"
import type { Aktivitaet, Bauprojekt, LagerArtikel } from "@workspace/domain"
import type { RealtimeContext } from "@/lib/realtime/project-tables"

export type AppShellData = {
  projectId: string
  aktivitaeten: Aktivitaet[]
  projects: Bauprojekt[]
  planungsUebersicht: PlanungsUebersicht
  betriebUebersicht: BetriebUebersicht
  lagerArtikel: LagerArtikel[]
  realtimeEnabled: boolean
  realtimeContext: RealtimeContext | null
}

export const loadAppShellData = cache(
  async function loadAppShellData(projectId: string): Promise<AppShellData> {
    const dataSource = getDataSourceMode()
    const realtimeEnabled = dataSource === "supabase"

    const [dashboard, aktivitaeten, lager, projectsResult, realtimeContext] =
      await Promise.all([
        loadProjectDashboardData(projectId),
        loadWorkerAktivitaeten(projectId),
        loadWorkerLagerData(projectId),
        getProjectRepository().listProjects(),
        realtimeEnabled
          ? loadWorkerRealtimeContext(projectId)
          : Promise.resolve(null),
      ])

    return {
      projectId,
      aktivitaeten,
      projects: projectsResult.data,
      planungsUebersicht: buildPlanungsUebersicht(dashboard),
      betriebUebersicht: buildBetriebUebersicht(dashboard),
      lagerArtikel: lager.artikel,
      realtimeEnabled,
      realtimeContext,
    }
  }
)
