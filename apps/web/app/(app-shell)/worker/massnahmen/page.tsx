import { WorkerMassnahmen } from "@/components/worker/worker-massnahmen"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Maßnahmen",
}

export default function WorkerMassnahmenPage() {
  return <WorkerMassnahmen />
}
