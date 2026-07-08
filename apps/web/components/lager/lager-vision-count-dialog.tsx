"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus } from "lucide-react"
import { toast } from "sonner"

import { bestaetigeVisionLagerBestandAction } from "@/lib/actions/project-actions"
import { usePresentAktivitaeten } from "@/components/notifications/activity-notification-presenter"
import type { VisionInventoryProposal } from "@/lib/vision/inventory-counting"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"

interface LagerVisionCountDialogProps {
  proposal: VisionInventoryProposal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (artikelId: string, aktuell: number) => void
}

export function LagerVisionCountDialog({
  proposal,
  open,
  onOpenChange,
  onSaved,
}: LagerVisionCountDialogProps) {
  const router = useRouter()
  const { presentAktivitaeten } = usePresentAktivitaeten()
  const [value, setValue] = useState(proposal?.detectedCount ?? 0)
  const [pending, startTransition] = useTransition()

  if (!proposal) {
    return null
  }

  const adjusted = Math.max(0, Math.round(value))
  const unchanged = adjusted === proposal.currentStock

  function saveCount() {
    if (!proposal) return

    if (unchanged) {
      toast.info(`${proposal.artikelName}: Bestand ist bereits aktuell`)
      onOpenChange(false)
      return
    }

    startTransition(async () => {
      try {
        const result = await bestaetigeVisionLagerBestandAction(
          proposal.artikelId,
          adjusted
        )
        onSaved(proposal.artikelId, result.gespeicherterBestand)
        if (result.aktivitaeten.length > 0) {
          presentAktivitaeten(result.aktivitaeten)
        }
        router.refresh()

        if (result.unchanged) {
          toast.info(`${proposal.artikelName}: Bestand ist bereits aktuell`)
        } else if (result.ueberbestandVersucht) {
          toast.warning(`${proposal.artikelName}: Maximum erreicht`)
        } else {
          toast.success(`${proposal.artikelName}: Bestand übernommen`)
        }

        onOpenChange(false)
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Vision-Bestand konnte nicht gespeichert werden"
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>Bestand übernehmen</DialogTitle>
            <Badge variant="secondary" className="font-mono tabular-nums">
              {Math.round(proposal.confidence * 100)}%
            </Badge>
          </div>
          <DialogDescription>
            Kamera erkennt einen stabilen Lagerbestand. Prüfe den Wert vor dem
            Speichern.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="truncate font-sans text-sm font-medium not-italic">
              {proposal.artikelName}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div>
                <p>Aktuell</p>
                <p className="font-mono text-xl font-semibold text-foreground tabular-nums">
                  {proposal.currentStock}
                </p>
              </div>
              <div>
                <p>Erkannt</p>
                <p className="font-mono text-xl font-semibold text-foreground tabular-nums">
                  {proposal.detectedCount}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="touch-manipulation rounded-full"
              disabled={pending || adjusted <= 0}
              onClick={() => setValue((current) => Math.max(0, current - 1))}
              aria-label={`${proposal.artikelName} verringern`}
            >
              <Minus />
            </Button>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={value}
              disabled={pending}
              onChange={(event) => setValue(Number(event.currentTarget.value))}
              className="h-11 text-center font-mono text-lg font-semibold tabular-nums"
              aria-label={`${proposal.artikelName} Bestand`}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="touch-manipulation rounded-full"
              disabled={pending}
              onClick={() => setValue((current) => current + 1)}
              aria-label={`${proposal.artikelName} erhöhen`}
            >
              <Plus />
            </Button>
          </div>

          <p className="font-mono text-xs text-muted-foreground tabular-nums">
            {proposal.frameCount} Frames stabil ·{" "}
            {new Date(proposal.capturedAt).toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Ignorieren
          </Button>
          <Button type="button" disabled={pending} onClick={saveCount}>
            {pending
              ? "Speichern…"
              : unchanged
                ? "Schließen"
                : "Bestand speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
