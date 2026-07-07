import { cache } from "react"

import { hasSupabasePublicEnv } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

import { RepositoryError } from "./errors"
import {
  buildAktivitaetsUebersicht,
  buildAnalyticsUebersicht,
  buildBauUebersicht,
  buildBetriebUebersicht,
  buildKostenprognosenUebersicht,
  buildPlanungsUebersicht,
  buildStandortUebersicht,
} from "./project-overviews"
import {
  fetchAllProjects,
  fetchProjectDashboardData,
} from "./supabase-project-data"
import type { ProjectRepository, RepositoryMeta, RepositoryResult } from "./types"

function createMeta(projectId?: string): RepositoryMeta {
  return {
    source: "supabase",
    generatedAt: new Date().toISOString(),
    realtime: {
      enabled: true,
      channel: projectId ? `project:${projectId}` : "projects",
    },
  }
}

function ok<T>(data: T, projectId?: string): RepositoryResult<T> {
  return {
    data,
    meta: createMeta(projectId),
    error: null,
  }
}

async function getSupabaseClient() {
  if (!hasSupabasePublicEnv()) {
    throw new RepositoryError(
      "Supabase ist nicht konfiguriert. Setze NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      503
    )
  }

  return createClient()
}

const loadProjectDashboardData = cache(async function loadProjectDashboardData(
  projectId: string
) {
  const supabase = await getSupabaseClient()
  return fetchProjectDashboardData(supabase, projectId)
})

export const supabaseProjectRepository: ProjectRepository = {
  async listProjects() {
    const supabase = await getSupabaseClient()
    const projekte = await fetchAllProjects(supabase)
    return ok(projekte)
  },

  async getDashboardData(projectId) {
    const data = await loadProjectDashboardData(projectId)
    return ok(data, projectId)
  },

  async getBauUebersicht(projectId) {
    const data = await loadProjectDashboardData(projectId)
    return ok(buildBauUebersicht(data), projectId)
  },

  async getPlanungsUebersicht(projectId) {
    const data = await loadProjectDashboardData(projectId)
    return ok(buildPlanungsUebersicht(data), projectId)
  },

  async getBetriebUebersicht(projectId) {
    const data = await loadProjectDashboardData(projectId)
    return ok(buildBetriebUebersicht(data), projectId)
  },

  async getAktivitaetsUebersicht(projectId) {
    const data = await loadProjectDashboardData(projectId)
    return ok(buildAktivitaetsUebersicht(data), projectId)
  },

  async getAnalyticsUebersicht(projectId) {
    const data = await loadProjectDashboardData(projectId)
    return ok(buildAnalyticsUebersicht(data), projectId)
  },

  async getKostenprognosenUebersicht(projectId) {
    const data = await loadProjectDashboardData(projectId)
    return ok(buildKostenprognosenUebersicht(data), projectId)
  },

  async getStandortUebersicht(projectId) {
    const data = await loadProjectDashboardData(projectId)
    return ok(buildStandortUebersicht(data), projectId)
  },
}
