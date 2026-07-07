import { RepositoryError } from "./errors"
import type { ProjectRepository } from "./types"

export const supabaseProjectRepository: ProjectRepository = {
  async listProjects() {
    throw new RepositoryError(
      "Supabase-Adapter ist vorbereitet, aber Schema und RLS fehlen noch.",
      501
    )
  },

  async getDashboardData() {
    throw new RepositoryError(
      "Supabase-Adapter ist vorbereitet, aber Schema und RLS fehlen noch.",
      501
    )
  },

  async getBauUebersicht() {
    throw new RepositoryError(
      "Supabase-Adapter ist vorbereitet, aber Schema und RLS fehlen noch.",
      501
    )
  },

  async getPlanungsUebersicht() {
    throw new RepositoryError(
      "Supabase-Adapter ist vorbereitet, aber Schema und RLS fehlen noch.",
      501
    )
  },

  async getBetriebUebersicht() {
    throw new RepositoryError(
      "Supabase-Adapter ist vorbereitet, aber Schema und RLS fehlen noch.",
      501
    )
  },

  async getAktivitaetsUebersicht() {
    throw new RepositoryError(
      "Supabase-Adapter ist vorbereitet, aber Schema und RLS fehlen noch.",
      501
    )
  },
}
