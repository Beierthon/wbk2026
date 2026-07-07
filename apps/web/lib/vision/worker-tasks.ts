export type WorkerTaskReviewDecision = "pending" | "confirmed" | "rejected"
export type VisionTargetKind = "material" | "zustand" | "freigabe"

export type VisionTargetState = {
  id: string
  title: string
  kind: VisionTargetKind
  location: string
  expected: string
  tolerance: string
  priority: string
}

export type VisionRecognitionDeviation = {
  id: string
  targetId: string
  observed: string
  deviation: string
  confidence: string
  capturedAt: string
}

export type WorkerTask = {
  id: string
  targetId: string
  title: string
  confidence: string
  location: string
  values: string[]
}

export type WorkerTaskReview = {
  decision: WorkerTaskReviewDecision
  errorOptions: string[]
  note: string
}

export function createInitialWorkerTaskReview(): WorkerTaskReview {
  return {
    decision: "pending",
    errorOptions: [],
    note: "",
  }
}

export function buildInitialWorkerTaskReviews(
  tasks: WorkerTask[]
): Record<string, WorkerTaskReview> {
  return Object.fromEntries(
    tasks.map((task) => [task.id, createInitialWorkerTaskReview()])
  )
}

export function buildWorkerTaskFromDeviation(
  target: VisionTargetState,
  deviation: VisionRecognitionDeviation
): WorkerTask {
  return {
    id: `task-${deviation.id}`,
    targetId: target.id,
    title: deviation.deviation,
    confidence: deviation.confidence,
    location: target.location,
    values: [
      `Expected: ${target.expected}`,
      `Observed by VLM: ${deviation.observed}`,
      `Deviation: ${deviation.deviation}`,
      `Tolerance: ${target.tolerance}`,
      `Priority: ${target.priority}`,
      `Source: ${deviation.capturedAt}`,
    ],
  }
}

export function buildWorkerTasksFromRecognition(
  targets: VisionTargetState[],
  deviations: VisionRecognitionDeviation[]
): WorkerTask[] {
  const targetsById = new Map(targets.map((target) => [target.id, target]))

  return deviations.flatMap((deviation) => {
    const target = targetsById.get(deviation.targetId)

    return target ? [buildWorkerTaskFromDeviation(target, deviation)] : []
  })
}
