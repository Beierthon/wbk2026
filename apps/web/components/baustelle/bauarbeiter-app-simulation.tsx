"use client"

import {
  Check,
  ClipboardList,
  FileWarning,
  ListChecks,
  Pencil,
  Play,
  Plus,
  X,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

import {
  buildInitialWorkerTaskReviews,
  buildWorkerTasksFromRecognition,
  createInitialWorkerTaskReview,
  type VisionRecognitionDeviation,
  type VisionTargetKind,
  type VisionTargetState,
  type WorkerTaskReview,
  type WorkerTaskReviewDecision,
} from "@/lib/vision/worker-tasks"

type TargetDraft = {
  title: string
  kind: VisionTargetKind
  location: string
  expected: string
  tolerance: string
  priority: string
}

const INITIAL_TARGETS: VisionTargetState[] = [
  {
    id: "target-beton",
    title: "Beton C30/37 Fundamentstreifen",
    kind: "material",
    location: "Bauteil C, Fundamentstreifen 4",
    expected: "38 t Beton C30/37 sichtbar oder geliefert",
    tolerance: "max. 1 t Abweichung",
    priority: "Lieferung vor 14:00 Uhr klaeren",
  },
  {
    id: "target-stahl",
    title: "Armierungsstahl Lagerzone Nord",
    kind: "material",
    location: "Lagerzone Nord",
    expected: "6 Paletten B500B verfuegbar",
    tolerance: "keine fehlende Palette",
    priority: "kritisch fuer Schalung Abschnitt B",
  },
  {
    id: "target-schalung",
    title: "Schalung Achse B3",
    kind: "freigabe",
    location: "Ebene 1, Achse B3",
    expected: "Schalung geschlossen und betonierbereit",
    tolerance: "keine offene Kante",
    priority: "Vorarbeiter prueft vor Freigabe",
  },
]

const MOCK_DEVIATIONS: VisionRecognitionDeviation[] = [
  {
    id: "deviation-beton",
    targetId: "target-beton",
    observed: "28 t Beton C30/37 sichtbar",
    deviation: "10 t Beton fehlt",
    confidence: "91%",
    capturedAt: "Mock-Frame 12:20",
  },
  {
    id: "deviation-stahl",
    targetId: "target-stahl",
    observed: "4 Paletten B500B erkannt",
    deviation: "2 Paletten Armierungsstahl fehlen",
    confidence: "84%",
    capturedAt: "Mock-Frame 12:21",
  },
  {
    id: "deviation-schalung",
    targetId: "target-schalung",
    observed: "offene Kante erkannt",
    deviation: "Schalung Achse B3 offen",
    confidence: "78%",
    capturedAt: "Mock-Frame 12:22",
  },
]

const ERROR_OPTIONS = [
  "Menge falsch",
  "Material falsch",
  "Ort falsch",
  "Zeitpunkt falsch",
  "Bild unscharf",
  "Schon erledigt",
]

const EMPTY_TARGET_DRAFT: TargetDraft = {
  title: "",
  kind: "material",
  location: "",
  expected: "",
  tolerance: "",
  priority: "",
}

function getDecisionLabel(decision: WorkerTaskReviewDecision) {
  if (decision === "confirmed") {
    return "Bestaetigt"
  }

  if (decision === "rejected") {
    return "Fehler"
  }

  return "Offen"
}

function getDecisionVariant(
  decision: WorkerTaskReviewDecision
): "secondary" | "destructive" | "outline" {
  if (decision === "confirmed") {
    return "secondary"
  }

  if (decision === "rejected") {
    return "destructive"
  }

  return "outline"
}

function draftFromTarget(target: VisionTargetState): TargetDraft {
  return {
    title: target.title,
    kind: target.kind,
    location: target.location,
    expected: target.expected,
    tolerance: target.tolerance,
    priority: target.priority,
  }
}

function buildMockRecognitionDeviations(
  targets: VisionTargetState[]
): VisionRecognitionDeviation[] {
  return targets.map((target) => {
    const existingDeviation = MOCK_DEVIATIONS.find(
      (deviation) => deviation.targetId === target.id
    )

    return (
      existingDeviation ?? {
        id: `deviation-${target.id}`,
        targetId: target.id,
        observed: `Mock erkennt Abweichung zu: ${target.expected}`,
        deviation: `Abweichung bei ${target.title}`,
        confidence: "72%",
        capturedAt: "Mock-Frame neu",
      }
    )
  })
}

const INITIAL_TASKS = buildWorkerTasksFromRecognition(
  INITIAL_TARGETS,
  buildMockRecognitionDeviations(INITIAL_TARGETS)
)

export function BauarbeiterAppSimulation() {
  const [targets, setTargets] = useState<VisionTargetState[]>(INITIAL_TARGETS)
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [reviews, setReviews] = useState<Record<string, WorkerTaskReview>>(() =>
    buildInitialWorkerTaskReviews(INITIAL_TASKS)
  )
  const [activeTaskId, setActiveTaskId] = useState(INITIAL_TASKS[0]?.id ?? "")
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null)
  const [draft, setDraft] = useState<TargetDraft>(EMPTY_TARGET_DRAFT)
  const [recognitionStatus, setRecognitionStatus] = useState(
    "Mock-Erkennung bereit. Es wird nichts gesendet."
  )

  const activeTask =
    tasks.find((task) => task.id === activeTaskId) ?? tasks[0] ?? null
  const activeReview = activeTask
    ? reviews[activeTask.id] ?? createInitialWorkerTaskReview()
    : null
  const confirmedCount = tasks.filter(
    (task) => reviews[task.id]?.decision === "confirmed"
  ).length
  const rejectedCount = tasks.filter(
    (task) => reviews[task.id]?.decision === "rejected"
  ).length
  const openCount = tasks.length - confirmedCount - rejectedCount
  const progress =
    tasks.length > 0
      ? Math.round(((confirmedCount + rejectedCount) / tasks.length) * 100)
      : 0
  const visibleTaskNumber = activeTask
    ? tasks.findIndex((task) => task.id === activeTask.id) + 1
    : 0
  const adminSummary = useMemo(
    () =>
      tasks.map((task) => ({
        task,
        review: reviews[task.id] ?? createInitialWorkerTaskReview(),
      })),
    [reviews, tasks]
  )

  function moveToNextTask(currentTaskId: string) {
    const currentIndex = tasks.findIndex((task) => task.id === currentTaskId)
    const afterCurrent = tasks
      .slice(currentIndex + 1)
      .find(
        (task) =>
          reviews[task.id]?.decision === "pending" || !reviews[task.id]
      )
    const beforeCurrent = tasks
      .slice(0, currentIndex)
      .find(
        (task) =>
          reviews[task.id]?.decision === "pending" || !reviews[task.id]
      )
    const nextTask = afterCurrent ?? beforeCurrent

    if (nextTask) {
      setActiveTaskId(nextTask.id)
    }
  }

  function confirmTask(taskId: string) {
    setReviews((current) => ({
      ...current,
      [taskId]: {
        ...(current[taskId] ?? createInitialWorkerTaskReview()),
        decision: "confirmed",
        errorOptions: [],
      },
    }))
    moveToNextTask(taskId)
  }

  function rejectTask(taskId: string) {
    setReviews((current) => ({
      ...current,
      [taskId]: {
        ...(current[taskId] ?? createInitialWorkerTaskReview()),
        decision: "rejected",
      },
    }))
  }

  function saveErrorAndNext(taskId: string) {
    rejectTask(taskId)
    moveToNextTask(taskId)
  }

  function toggleErrorOption(taskId: string, option: string) {
    setReviews((current) => {
      const review = current[taskId] ?? createInitialWorkerTaskReview()
      const selected = review.errorOptions.includes(option)

      return {
        ...current,
        [taskId]: {
          ...review,
          decision: "rejected",
          errorOptions: selected
            ? review.errorOptions.filter((item) => item !== option)
            : [...review.errorOptions, option],
        },
      }
    })
  }

  function setNote(taskId: string, note: string) {
    setReviews((current) => ({
      ...current,
      [taskId]: {
        ...(current[taskId] ?? createInitialWorkerTaskReview()),
        decision: "rejected",
        note,
      },
    }))
  }

  function runMockRecognition() {
    const nextTasks = buildWorkerTasksFromRecognition(
      targets,
      buildMockRecognitionDeviations(targets)
    )

    setTasks(nextTasks)
    setReviews((current) => {
      const nextReviews: Record<string, WorkerTaskReview> = {}

      for (const task of nextTasks) {
        nextReviews[task.id] =
          current[task.id] ?? createInitialWorkerTaskReview()
      }

      return nextReviews
    })
    setActiveTaskId(nextTasks[0]?.id ?? "")
    setRecognitionStatus(
      `${nextTasks.length} Abweichungen aus lokalen Mock-VLM-Daten erzeugt.`
    )
  }

  function editTarget(target: VisionTargetState) {
    setEditingTargetId(target.id)
    setDraft(draftFromTarget(target))
  }

  function resetDraft() {
    setEditingTargetId(null)
    setDraft(EMPTY_TARGET_DRAFT)
  }

  function saveTargetDraft() {
    if (!draft.title.trim() || !draft.expected.trim()) {
      return
    }

    if (editingTargetId) {
      setTargets((current) =>
        current.map((target) =>
          target.id === editingTargetId
            ? {
                ...target,
                title: draft.title.trim(),
                kind: draft.kind,
                location: draft.location.trim() || "Unbekannter Ort",
                expected: draft.expected.trim(),
                tolerance: draft.tolerance.trim() || "keine Abweichung",
                priority: draft.priority.trim() || "normal",
              }
            : target
        )
      )
      resetDraft()
      return
    }

    const targetId = `target-${Date.now()}`
    const nextTarget: VisionTargetState = {
      id: targetId,
      title: draft.title.trim(),
      kind: draft.kind,
      location: draft.location.trim() || "Unbekannter Ort",
      expected: draft.expected.trim(),
      tolerance: draft.tolerance.trim() || "keine Abweichung",
      priority: draft.priority.trim() || "normal",
    }

    setTargets((current) => [...current, nextTarget])
    setRecognitionStatus(
      "Sollzustand gespeichert. Mock-Erkennung erzeugt Tasks erst nach Start."
    )
    resetDraft()
  }

  return (
    <div className="mx-auto grid min-h-[calc(100svh-6.5rem)] w-full max-w-5xl gap-4 px-0 pb-4 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <section className="flex min-h-[calc(100svh-7rem)] flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">
              Bauarbeiter App
            </h1>
            <p className="text-sm text-muted-foreground">
              Nur Abweichungen aus dem VLM-Abgleich landen hier als Task.
            </p>
          </div>
          <Badge variant="outline">{progress}%</Badge>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border bg-card p-3">
            <p className="text-xs text-muted-foreground">Offen</p>
            <p className="text-xl font-semibold">{openCount}</p>
          </div>
          <div className="rounded-2xl border bg-card p-3">
            <p className="text-xs text-muted-foreground">Haken</p>
            <p className="text-xl font-semibold">{confirmedCount}</p>
          </div>
          <div className="rounded-2xl border bg-card p-3">
            <p className="text-xs text-muted-foreground">Nein</p>
            <p className="text-xl font-semibold">{rejectedCount}</p>
          </div>
        </div>

        {activeTask && activeReview ? (
          <Card className="flex-1 justify-between">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {visibleTaskNumber}/{tasks.length}
                </Badge>
                <Badge variant={getDecisionVariant(activeReview.decision)}>
                  {getDecisionLabel(activeReview.decision)}
                </Badge>
              </div>
              <CardTitle className="text-xl">{activeTask.title}</CardTitle>
              <CardDescription>
                {activeTask.location} - VLM Sicherheit {activeTask.confidence}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-2xl border bg-muted/30 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <ListChecks className="size-4" />
                  Soll/Ist-Abgleich
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {activeTask.values.map((value) => (
                    <li key={value}>{value}</li>
                  ))}
                </ul>
              </div>

              {activeReview.decision === "rejected" ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileWarning className="size-4" />
                    Fehler dokumentieren
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {ERROR_OPTIONS.map((option) => {
                      const active = activeReview.errorOptions.includes(option)

                      return (
                        <Button
                          key={option}
                          type="button"
                          variant={active ? "secondary" : "outline"}
                          className={cn(
                            "h-11 rounded-2xl text-xs",
                            active && "ring-2 ring-primary/20"
                          )}
                          aria-pressed={active}
                          onClick={() =>
                            toggleErrorOption(activeTask.id, option)
                          }
                        >
                          {option}
                        </Button>
                      )
                    })}
                  </div>
                  <Textarea
                    value={activeReview.note}
                    onChange={(event) =>
                      setNote(activeTask.id, event.target.value)
                    }
                    placeholder="Notiz oder Rueckfrage..."
                    className="min-h-20"
                  />
                  <Button
                    type="button"
                    className="h-12 rounded-2xl"
                    onClick={() => saveErrorAndNext(activeTask.id)}
                  >
                    Fehler speichern
                  </Button>
                </div>
              ) : null}

              <div className="sticky bottom-0 -mx-1 mt-auto grid grid-cols-2 gap-2 bg-background/95 p-1 pb-2 backdrop-blur">
                <Button
                  type="button"
                  className="h-16 rounded-2xl text-base"
                  onClick={() => confirmTask(activeTask.id)}
                >
                  <Check className="size-5" />
                  Haken
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="h-16 rounded-2xl text-base"
                  onClick={() => rejectTask(activeTask.id)}
                >
                  <X className="size-5" />
                  Nein
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Keine Abweichungen</CardTitle>
              <CardDescription>
                Wenn die Erkennung spaeter Abweichungen findet, erscheinen sie
                hier automatisch als Bauarbeiter-Tasks.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5" />
          <h2 className="text-lg font-semibold">Admin Panel</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Sollzustand codieren
            </CardTitle>
            <CardDescription>
              Diese Daten werden spaeter an die Vision-Pipeline uebergeben.
              Aktuell laeuft nur ein lokaler Mock-Abgleich.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Sollzustand, z.B. Beton C30/37 Fundament"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={draft.kind}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    kind: event.target.value as VisionTargetKind,
                  }))
                }
                className="h-8 rounded-2xl bg-input/50 px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <option value="material">Material</option>
                <option value="zustand">Zustand</option>
                <option value="freigabe">Freigabe</option>
              </select>
              <Input
                value={draft.location}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                placeholder="Ort"
              />
            </div>
            <Textarea
              value={draft.expected}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  expected: event.target.value,
                }))
              }
              placeholder="Soll, z.B. 38 t Beton C30/37 sichtbar oder geliefert"
              className="min-h-20"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={draft.tolerance}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    tolerance: event.target.value,
                  }))
                }
                placeholder="Toleranz"
              />
              <Input
                value={draft.priority}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    priority: event.target.value,
                  }))
                }
                placeholder="Prioritaet"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                className="h-11 rounded-2xl"
                onClick={saveTargetDraft}
              >
                <Plus className="size-4" />
                {editingTargetId ? "Speichern" : "Adden"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl"
                onClick={resetDraft}
              >
                Zuruecksetzen
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vision-Abgleich</CardTitle>
            <CardDescription>{recognitionStatus}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="secondary"
              className="h-11 w-full rounded-2xl"
              onClick={runMockRecognition}
            >
              <Play className="size-4" />
              Mock-VLM auswerten
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Sollzustaende</p>
          {targets.map((target) => (
            <div
              key={target.id}
              className="flex flex-col gap-3 rounded-2xl border bg-card p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {target.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {target.location} - {target.expected}
                  </p>
                </div>
                <Badge variant="outline">{target.kind}</Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit rounded-2xl"
                onClick={() => editTarget(target)}
              >
                <Pencil className="size-4" />
                Bearbeiten
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Erzeugte Tasks</p>
          {adminSummary.map(({ task, review }) => (
            <div
              key={task.id}
              className="flex flex-col gap-3 rounded-2xl border bg-card p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {task.location} - {task.confidence}
                  </p>
                </div>
                <Badge variant={getDecisionVariant(review.decision)}>
                  {getDecisionLabel(review.decision)}
                </Badge>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-fit rounded-2xl"
                onClick={() => setActiveTaskId(task.id)}
              >
                Oeffnen
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
