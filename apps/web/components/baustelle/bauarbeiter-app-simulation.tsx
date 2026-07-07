"use client"

import Link from "next/link"
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  MessageSquareText,
  ScanLine,
  X,
} from "lucide-react"
import { useMemo, useState } from "react"

import {
  BAULEITER_ESCALATIONS,
  CLASSIFICATION_CATEGORY_META,
  PRIMITIVE_RECOGNITION_CLASSIFICATIONS,
  RECOGNITION_PIPELINE,
  type PrimitiveRecognitionClassification,
} from "@/lib/vision/construction-classification-demo"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

type WorkerAnswer = "pending" | "yes" | "no"

type WorkerReview = {
  answer: WorkerAnswer
  actualValue: string
  comment: string
  errorOptions: string[]
}

const TASKS = PRIMITIVE_RECOGNITION_CLASSIFICATIONS

function createInitialReview(
  task: PrimitiveRecognitionClassification
): WorkerReview {
  return {
    answer: "pending",
    actualValue: task.defaultNegativeValue,
    comment: "",
    errorOptions: [],
  }
}

function buildInitialReviews(): Record<string, WorkerReview> {
  return Object.fromEntries(
    TASKS.map((task) => [task.id, createInitialReview(task)])
  )
}

function getAnswerLabel(answer: WorkerAnswer) {
  if (answer === "yes") {
    return "Ja"
  }

  if (answer === "no") {
    return "Nein"
  }

  return "Offen"
}

function getAnswerVariant(answer: WorkerAnswer) {
  if (answer === "yes") {
    return "secondary" as const
  }

  if (answer === "no") {
    return "destructive" as const
  }

  return "outline" as const
}

function getNextPendingTaskId(
  currentTaskId: string,
  reviews: Record<string, WorkerReview>
) {
  const currentIndex = TASKS.findIndex((task) => task.id === currentTaskId)
  const orderedTasks = [
    ...TASKS.slice(currentIndex + 1),
    ...TASKS.slice(0, currentIndex),
  ]
  const nextPending = orderedTasks.find(
    (task) => reviews[task.id]?.answer === "pending"
  )

  return nextPending?.id ?? currentTaskId
}

export function BauarbeiterAppSimulation() {
  const [reviews, setReviews] = useState<Record<string, WorkerReview>>(
    buildInitialReviews
  )
  const [activeTaskId, setActiveTaskId] = useState(TASKS[0]?.id ?? "")
  const [negativeDialogOpen, setNegativeDialogOpen] = useState(false)

  const activeIndex = Math.max(
    TASKS.findIndex((task) => task.id === activeTaskId),
    0
  )
  const activeTask = TASKS[activeIndex] ?? TASKS[0]
  const activeReview = activeTask ? reviews[activeTask.id] : undefined
  const yesCount = TASKS.filter((task) => reviews[task.id]?.answer === "yes")
    .length
  const noCount = TASKS.filter((task) => reviews[task.id]?.answer === "no")
    .length
  const openCount = TASKS.length - yesCount - noCount
  const doneCount = yesCount + noCount
  const progress = Math.round((doneCount / TASKS.length) * 100)
  const escalatedIssueCount = useMemo(
    () => new Set(TASKS.flatMap((task) => task.escalationIds)).size,
    []
  )

  function patchReview(taskId: string, patch: Partial<WorkerReview>) {
    setReviews((current) => {
      const task = TASKS.find((item) => item.id === taskId)
      const fallback = task
        ? createInitialReview(task)
        : {
            answer: "pending" as const,
            actualValue: "",
            comment: "",
            errorOptions: [],
          }

      return {
        ...current,
        [taskId]: {
          ...(current[taskId] ?? fallback),
          ...patch,
        },
      }
    })
  }

  function answerYes(task: PrimitiveRecognitionClassification) {
    const nextReviews = {
      ...reviews,
      [task.id]: {
        ...createInitialReview(task),
        answer: "yes" as const,
      },
    }

    setReviews(nextReviews)
    setNegativeDialogOpen(false)
    setActiveTaskId(getNextPendingTaskId(task.id, nextReviews))
  }

  function answerNo(task: PrimitiveRecognitionClassification) {
    patchReview(task.id, { answer: "no" })
    setNegativeDialogOpen(true)
  }

  function saveNegativeReview(task: PrimitiveRecognitionClassification) {
    const currentReview = reviews[task.id] ?? createInitialReview(task)
    const nextReviews = {
      ...reviews,
      [task.id]: {
        ...currentReview,
        answer: "no" as const,
        actualValue:
          currentReview.actualValue.trim() || task.defaultNegativeValue,
      },
    }

    setReviews(nextReviews)
    setNegativeDialogOpen(false)
    setActiveTaskId(getNextPendingTaskId(task.id, nextReviews))
  }

  function toggleErrorOption(taskId: string, option: string) {
    const review = reviews[taskId]
    const currentOptions = review?.errorOptions ?? []
    const active = currentOptions.includes(option)

    patchReview(taskId, {
      answer: "no",
      errorOptions: active
        ? currentOptions.filter((item) => item !== option)
        : [...currentOptions, option],
    })
  }

  function moveTask(offset: number) {
    const nextIndex = (activeIndex + offset + TASKS.length) % TASKS.length
    setActiveTaskId(TASKS[nextIndex]?.id ?? activeTaskId)
    setNegativeDialogOpen(false)
  }

  if (!activeTask || !activeReview) {
    return null
  }

  const categoryMeta = CLASSIFICATION_CATEGORY_META[activeTask.category]

  return (
    <div className="mx-auto flex min-h-[calc(100svh-6rem)] w-full max-w-2xl flex-col gap-3 pb-3">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">
            Bauarbeiter-App
          </h1>
          <p className="text-sm text-muted-foreground">
            Fehlerliste aus Primitive Recognition. Vor Ort nur Ja oder Nein.
          </p>
        </div>
        <Badge variant="outline">{progress}%</Badge>
      </header>

      <section className="rounded-md border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <ScanLine className="size-4" />
          Scanner-Ablauf
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {RECOGNITION_PIPELINE.map((stage, index) => (
            <div key={stage} className="flex min-w-0 items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-sm border bg-muted font-mono text-[11px]">
                {index + 1}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {stage}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Offen", openCount],
          ["Ja", yesCount],
          ["Nein", noCount],
          ["Bauleiter", escalatedIssueCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border bg-card p-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {value}
            </p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {activeIndex + 1}/{TASKS.length}
            </Badge>
            <Badge variant="secondary">{categoryMeta.shortLabel}</Badge>
            <Badge variant={getAnswerVariant(activeReview.answer)}>
              {getAnswerLabel(activeReview.answer)}
            </Badge>
            <Badge variant="outline">{activeTask.confidence}%</Badge>
          </div>
          <div>
            <CardTitle className="text-lg">{activeTask.title}</CardTitle>
            <CardDescription>{activeTask.location}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-base font-semibold">{activeTask.question}</p>
          </div>

          <div className="grid gap-2 text-sm">
            <div className="rounded-md border p-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Soll
              </p>
              <p className="mt-1">{activeTask.expected}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Recognition
              </p>
              <p className="mt-1">{activeTask.recognized}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Planvergleich
              </p>
              <p className="mt-1">{activeTask.planComparison}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              className="h-16 text-base"
              onClick={() => answerYes(activeTask)}
            >
              <Check className="size-5" />
              Ja
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-16 text-base"
              onClick={() => answerNo(activeTask)}
            >
              <X className="size-5" />
              Nein
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={() => moveTask(-1)}>
              <ChevronLeft className="size-4" />
              Zurueck
            </Button>
            <Button type="button" variant="outline" onClick={() => moveTask(1)}>
              Weiter
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="rounded-md border bg-card p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ListChecks className="size-4" />
            Fehlerliste
          </div>
          <span className="text-xs text-muted-foreground">
            {doneCount}/{TASKS.length} geprueft
          </span>
        </div>
        <div className="flex flex-col divide-y">
          {TASKS.map((task) => {
            const review = reviews[task.id] ?? createInitialReview(task)
            const meta = CLASSIFICATION_CATEGORY_META[task.category]
            const active = task.id === activeTask.id

            return (
              <button
                key={task.id}
                type="button"
                className={cn(
                  "flex w-full items-start justify-between gap-3 py-3 text-left first:pt-0 last:pb-0",
                  active && "text-primary"
                )}
                onClick={() => {
                  setActiveTaskId(task.id)
                  setNegativeDialogOpen(false)
                }}
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {task.title}
                    </span>
                    <Badge variant="outline">{meta.label}</Badge>
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {task.recognized}
                  </span>
                  {review.answer === "no" ? (
                    <span className="mt-1 block truncate text-xs text-destructive">
                      Fehler: {review.actualValue}
                    </span>
                  ) : null}
                </span>
                <Badge variant={getAnswerVariant(review.answer)}>
                  {getAnswerLabel(review.answer)}
                </Badge>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-md border bg-card p-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              Groessere Probleme gehen an die Bauleiter-App
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mock: Nachbestellung, falsches Teil, Planfreigabe und Terminrisiko
              werden analytisch gebuendelt.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {BAULEITER_ESCALATIONS.map((issue) => (
                <Badge
                  key={issue.id}
                  variant={
                    issue.severity === "kritisch" ? "destructive" : "outline"
                  }
                >
                  {issue.title}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          className="mt-3 w-full"
          render={<Link href="/bauleiter-app" />}
        >
          Bauleiter-App oeffnen
        </Button>
      </section>

      <Dialog open={negativeDialogOpen} onOpenChange={setNegativeDialogOpen}>
        <DialogContent className="gap-4 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Fehler erfassen</DialogTitle>
            <DialogDescription>
              {categoryMeta.label}: {activeTask.title}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">
                {activeTask.negativeInputLabel}
              </span>
              <Input
                value={activeReview.actualValue}
                onChange={(event) =>
                  patchReview(activeTask.id, {
                    answer: "no",
                    actualValue: event.target.value,
                  })
                }
                placeholder={activeTask.negativePlaceholder}
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              {activeTask.errorOptions.map((option) => {
                const selected = activeReview.errorOptions.includes(option)

                return (
                  <Button
                    key={option}
                    type="button"
                    variant={selected ? "secondary" : "outline"}
                    className={cn(
                      "h-auto min-h-10 justify-start whitespace-normal py-2 text-left text-xs leading-tight",
                      selected && "ring-2 ring-primary/20"
                    )}
                    aria-pressed={selected}
                    onClick={() => toggleErrorOption(activeTask.id, option)}
                  >
                    {option}
                  </Button>
                )
              })}
            </div>

            <label className="grid gap-1.5 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <MessageSquareText className="size-4" />
                Kommentar
              </span>
              <Textarea
                value={activeReview.comment}
                onChange={(event) =>
                  patchReview(activeTask.id, {
                    answer: "no",
                    comment: event.target.value,
                  })
                }
                placeholder="Kurze Notiz fuer Bauleitung oder Planung..."
                className="min-h-24"
              />
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNegativeDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button type="button" onClick={() => saveNegativeReview(activeTask)}>
              Fehler speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
