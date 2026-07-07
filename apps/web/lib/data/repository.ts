import { getDataSourceMode } from "./config"
import { mockProjectRepository } from "./mock-repository"
import { supabaseProjectRepository } from "./supabase-repository"
import type { ProjectRepository } from "./types"

export function getProjectRepository(): ProjectRepository {
  const mode = getDataSourceMode()

  if (mode === "supabase") {
    return supabaseProjectRepository
  }

  return mockProjectRepository
}
