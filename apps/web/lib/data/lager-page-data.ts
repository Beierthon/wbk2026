import { cacheLife, cacheTag } from "next/cache"
import { cache } from "react"

import { projectCacheTag } from "@/lib/cache/project-tags"
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

async function loadLagerBestandUncached(
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

async function getCachedLagerBestand(
  projectId: string
): Promise<LagerBestandData> {
  "use cache"
  cacheTag(projectCacheTag(projectId))
  cacheLife("minutes")

  return loadLagerBestandUncached(projectId)
}

/** Worker lager data with cross-request cache + realtime tag invalidation. */
export const loadWorkerLagerData = cache(async function loadWorkerLagerData(
  projectId: string
): Promise<LagerBestandData> {
  if (process.env.VITEST) {
    return loadLagerBestandUncached(projectId)
  }

  return getCachedLagerBestand(projectId)
})

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

export async function loadWorkerAktivitaeten(
  projectId: string
): Promise<Aktivitaet[]> {
  const data = await loadWorkerLagerData(projectId)
  return data.aktivitaeten
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
