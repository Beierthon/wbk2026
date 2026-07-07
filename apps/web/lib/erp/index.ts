import { getProjectRepository } from "@/lib/data"
import { RepositoryError } from "@/lib/data/errors"
import { buildErpSyncSnapshot } from "./build-snapshot"
import type { ErpAdapter, ErpSyncSnapshot } from "./types"

class ProjectErpAdapter implements ErpAdapter {
  async getSyncSnapshot(projectId: string): Promise<ErpSyncSnapshot> {
    const repository = getProjectRepository()
    const result = await repository.getDashboardData(projectId)
    const referenceTime = result.meta.generatedAt

    return buildErpSyncSnapshot(
      projectId,
      result.data,
      result.meta.source,
      referenceTime
    )
  }
}

const erpAdapter = new ProjectErpAdapter()

export function getErpAdapter(): ErpAdapter {
  return erpAdapter
}

export async function getErpSyncSnapshot(
  projectId: string
): Promise<ErpSyncSnapshot> {
  return getErpAdapter().getSyncSnapshot(projectId)
}

export async function getErpSyncSnapshotSafe(projectId: string) {
  try {
    const data = await getErpSyncSnapshot(projectId)

    return {
      data,
      error: null,
    }
  } catch (error) {
    if (error instanceof RepositoryError) {
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status,
        },
      }
    }

    return {
      data: null,
      error: {
        message: "ERP/EAP sync could not be loaded.",
        status: 500,
      },
    }
  }
}

export type {
  ErpAdapter,
  ErpObjectKind,
  ErpSyncRecord,
  ErpSyncSnapshot,
  ErpSyncStatus,
  ErpSystemSummary,
} from "./types"
