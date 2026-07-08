import { WBK_DEMO_DATA } from "@workspace/domain/demo-data"
import { createAnonServerClient } from "@/lib/supabase/anon"
import { hasSupabasePublicEnv } from "@/lib/supabase/env"
import type { Aktivitaet } from "@workspace/domain"
import type { RealtimeContext } from "@/lib/realtime/project-tables"

import { getDataSourceMode } from "./config"
import { fetchLagerBestand } from "./lager-bestand"
import { getMockStore } from "./mock-store"
import type { LagerBestandData } from "./types"

function loadMockLagerBestand(projectId: string): LagerBestandData {
  const store = getMockStore()
  return {
    artikel: store.lagerArtikel.filter((item) => item.projektId === projectId),
    aktivitaeten: store.aktivitaeten.filter(
      (item) => item.projektId === projectId
    ),
  }
}

export function loadDemoRealtimeContext(projectId: string): RealtimeContext {
  const projekt =
    WBK_DEMO_DATA.projekte.find((item) => item.id === projectId) ??
    WBK_DEMO_DATA.projekte[0]

  if (!projekt) {
    return { projectId, standortId: "", planstandIds: [] }
  }

  const planstaende = WBK_DEMO_DATA.planstaende.filter(
    (item) => item.projektId === projekt.id
  )

  return {
    projectId: projekt.id,
    standortId: projekt.standortId,
    planstandIds: planstaende.map((item) => item.id),
  }
}

/** Worker home: prefer Supabase, fall back to mock/demo when unavailable. */
export async function loadWorkerLagerData(
  projectId: string
): Promise<LagerBestandData> {
  if (getDataSourceMode() === "mock") {
    return loadMockLagerBestand(projectId)
  }

  if (!hasSupabasePublicEnv()) {
    return loadMockLagerBestand(projectId)
  }

  try {
    const supabase = createAnonServerClient()
    return await fetchLagerBestand(supabase, projectId)
  } catch {
    return loadMockLagerBestand(projectId)
  }
}

export async function loadWorkerAktivitaeten(
  projectId: string
): Promise<Aktivitaet[]> {
  if (getDataSourceMode() === "mock") {
    return loadMockLagerBestand(projectId).aktivitaeten
  }

  if (!hasSupabasePublicEnv()) {
    return loadMockLagerBestand(projectId).aktivitaeten
  }

  try {
    const supabase = createAnonServerClient()
    const data = await fetchLagerBestand(supabase, projectId)
    return data.aktivitaeten
  } catch {
    return loadMockLagerBestand(projectId).aktivitaeten
  }
}

/** Realtime context for worker shell; null when Supabase should stay disabled. */
export async function loadWorkerRealtimeContext(
  projectId: string
): Promise<RealtimeContext | null> {
  if (getDataSourceMode() !== "supabase" || !hasSupabasePublicEnv()) {
    return null
  }

  try {
    const { loadProjectDashboardData } = await import("./cached-dashboard")
    const dashboard = await loadProjectDashboardData(projectId)
    return {
      projectId,
      standortId: dashboard.standort.id,
      planstandIds: dashboard.planstaende.map((planstand) => planstand.id),
    }
  } catch {
    return loadDemoRealtimeContext(projectId)
  }
}
