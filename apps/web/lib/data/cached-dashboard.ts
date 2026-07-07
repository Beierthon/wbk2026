import { cacheLife, cacheTag } from "next/cache"
import { cache } from "react"

import { projectCacheTag } from "@/lib/cache/project-tags"
import { createAnonServerClient } from "@/lib/supabase/anon"
import { hasSupabasePublicEnv } from "@/lib/supabase/env"

import { getDataSourceMode } from "./config"
import { RepositoryError } from "./errors"
import { getMockStore } from "./mock-store"
import { fetchProjectDashboardData } from "./supabase-project-data"
import type { ProjectDashboardData } from "./types"

function loadMockDashboardData(projectId: string): ProjectDashboardData {
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
}

async function loadSupabaseDashboardData(
  projectId: string
): Promise<ProjectDashboardData> {
  if (!hasSupabasePublicEnv()) {
    throw new RepositoryError(
      "Supabase ist nicht konfiguriert. Setze NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      503
    )
  }

  const supabase = createAnonServerClient()
  return fetchProjectDashboardData(supabase, projectId)
}

/** Cross-request cache with tag invalidation on mutations. */
async function getCachedDashboard(projectId: string): Promise<ProjectDashboardData> {
  "use cache"
  cacheTag(projectCacheTag(projectId))
  cacheLife("minutes")

  const mode = getDataSourceMode()
  if (mode === "mock") {
    return loadMockDashboardData(projectId)
  }

  return loadSupabaseDashboardData(projectId)
}

/** Per-request dedup on top of the cross-request cache. */
export const loadProjectDashboardData = cache(async function loadProjectDashboardData(
  projectId: string
): Promise<ProjectDashboardData> {
  if (process.env.VITEST) {
    const mode = getDataSourceMode()
    if (mode === "mock") {
      return loadMockDashboardData(projectId)
    }
    return loadSupabaseDashboardData(projectId)
  }

  return getCachedDashboard(projectId)
})
