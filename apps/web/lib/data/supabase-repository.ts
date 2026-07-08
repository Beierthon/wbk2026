import { DOMAIN_TABLES } from "@workspace/domain"
import type { BauprojektDatenmodell, MutationResult } from "@workspace/domain"
import type { SupabaseClient } from "@supabase/supabase-js"
import { hasSupabasePublicEnv } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

import { loadProjectDashboardData } from "./cached-dashboard"
import { RepositoryError } from "./errors"
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
import { fetchAllProjects } from "./supabase-project-data"
import { toRow } from "./supabase-mappers"
import type {
  ProjectRepository,
  RepositoryMeta,
  RepositoryResult,
} from "./types"

async function upsertRows(
  supabase: SupabaseClient,
  key: keyof BauprojektDatenmodell,
  items: readonly { id: string }[]
): Promise<void> {
  const table = DOMAIN_TABLES[key]
  const rows = items.map((item) => toRow(item as Record<string, unknown>))
  const { error } = await supabase.from(table).upsert(rows)
  if (error) {
    throw new RepositoryError(
      `Schreiben in ${table} fehlgeschlagen: ${error.message}`,
      500
    )
  }
}

async function deleteRows(
  supabase: SupabaseClient,
  key: keyof BauprojektDatenmodell,
  ids: readonly string[]
): Promise<void> {
  const table = DOMAIN_TABLES[key]
  const { error } = await supabase.from(table).delete().in("id", [...ids])
  if (error) {
    throw new RepositoryError(
      `Löschen in ${table} fehlgeschlagen: ${error.message}`,
      500
    )
  }
}

function createMeta(projectId?: string): RepositoryMeta {
  return {
    source: "supabase",
    generatedAt: "",
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

  async getRoadmapUebersicht(projectId) {
    const data = await loadProjectDashboardData(projectId)
    return ok(buildRoadmapUebersicht(data), projectId)
  },

  async getLagerBestand(projectId) {
    const { loadWorkerLagerData } = await import("./lager-page-data")
    const data = await loadWorkerLagerData(projectId)
    return ok(data, projectId)
  },

  async applyMutation(projectId, result: MutationResult) {
    const supabase = await getSupabaseClient()

    for (const key of Object.keys(
      result.upserts
    ) as (keyof BauprojektDatenmodell)[]) {
      const items = result.upserts[key]
      if (items && items.length > 0) {
        await upsertRows(supabase, key, items as { id: string }[])
      }
    }

    if (result.deletes) {
      for (const key of Object.keys(
        result.deletes
      ) as (keyof BauprojektDatenmodell)[]) {
        const ids = result.deletes[key]
        if (ids && ids.length > 0) {
          await deleteRows(supabase, key, ids)
        }
      }
    }

    await upsertRows(supabase, "aktivitaeten", [
      result.aktivitaet,
      ...(result.zusatzAktivitaeten ?? []),
    ])

    if (result.auditEintraege.length > 0) {
      await upsertRows(supabase, "auditEintraege", result.auditEintraege)
    }

    return ok(undefined, projectId)
  },
}
