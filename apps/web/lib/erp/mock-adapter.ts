import { getProjectRepository } from "../data/repository"
import { buildErpEapSnapshot } from "./build-snapshot"
import type { ErpEapAdapter, ErpEapSnapshot } from "./types"

export const mockErpEapAdapter: ErpEapAdapter = {
  async getSnapshot(projectId: string): Promise<ErpEapSnapshot> {
    const { data, meta } = await getProjectRepository().getDashboardData(
      projectId
    )

    return buildErpEapSnapshot(projectId, data, meta.source)
  },
}
