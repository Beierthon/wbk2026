import { MassnahmenPanel } from "@/components/massnahmen/massnahmen-panel"
import { loadWorkerAktivitaeten } from "@/lib/data/lager-page-data"
import { getActiveProjectId } from "@/lib/project"

export default async function WorkerMassnahmenPage() {
  const projectId = await getActiveProjectId()
  const aktivitaeten = await loadWorkerAktivitaeten(projectId)

  return (
    <MassnahmenPanel projectId={projectId} aktivitaeten={aktivitaeten} />
  )
}
