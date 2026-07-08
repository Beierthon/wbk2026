"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus } from "lucide-react"
import { toast } from "sonner"

import { bestaetigeMehrereVisionLagerBestaendeAction } from "@/lib/actions/project-actions"
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

interface LagerVisionBatchDialogProps {
  proposals: VisionInventoryProposal[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (updates: Array<{ artikelId: string; aktuell: number }>) => void
}

export function LagerVisionBatchDialog({
  proposals,
  open,
  onOpenChange,
  onSaved,
}: LagerVisionBatchDialogProps) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, number>>({})
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) {
      return
    }

    setValues(
      Object.fromEntries(
        proposals.map((proposal) => [
          proposal.artikelId,
          proposal.detectedCount,
        ])
      )
    )
  }, [open, proposals])

  if (proposals.length === 0) {
    return null
  }

  function updateValue(artikelId: string, next: number) {
    setValues((current) => ({
      ...current,
      [artikelId]: Math.max(0, Math.round(next)),
    }))
  }

  function saveAll() {
    const updates = proposals
      .map((proposal) => ({
        artikelId: proposal.artikelId,
        neuerBestand: values[proposal.artikelId] ?? proposal.detectedCount,
        currentStock: proposal.currentStock,
      }))
      .filter((update) => update.neuerBestand !== update.currentStock)
      .map(({ artikelId, neuerBestand }) => ({ artikelId, neuerBestand }))

    if (updates.length === 0) {
      toast.info("Alle Bestände sind bereits aktuell")
      onOpenChange(false)
      return
    }

    startTransition(async () => {
      try {
        const result = await bestaetigeMehrereVisionLagerBestaendeAction(updates)
        const saved = result.gespeichert.filter((entry) => !entry.unchanged)

        onSaved(
          saved.map((entry) => ({
            artikelId: entry.artikelId,
            aktuell: entry.gespeicherterBestand,
          }))
        )
        router.refresh()

        const warnings = saved.filter((entry) => entry.ueberbestandVersucht)
        if (warnings.length > 0) {
          toast.warning(
            `${warnings.length} Artikel${warnings.length === 1 ? "" : "e"} am Maximum begrenzt`
          )
        } else {
          toast.success(
            `${saved.length} Bestand${saved.length === 1 ? "" : "e"} übernommen`
          )
        }

        onOpenChange(false)
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Vision-Bestände konnten nicht gespeichert werden"
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bestände übernehmen</DialogTitle>
          <DialogDescription>
            Die Kamera hat mehrere stabile Bestände erkannt. Prüfe die Werte vor
            dem Speichern.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex max-h-[min(50dvh,24rem)] flex-col gap-3 overflow-y-auto overscroll-contain">
          {proposals.map((proposal) => {
            const value = values[proposal.artikelId] ?? proposal.detectedCount
            const unchanged = value === proposal.currentStock

            return (
              <li
                key={proposal.artikelId}
                className="rounded-xl border border-border bg-muted/30 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-sans text-sm font-medium not-italic">
                      {proposal.artikelName}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
                      Aktuell {proposal.currentStock} · Erkannt{" "}
                      {proposal.detectedCount}
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-mono tabular-nums">
                    {Math.round(proposal.confidence * 100)}%
                  </Badge>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="touch-manipulation rounded-full"
                    disabled={pending || value <= 0}
                    onClick={() => updateValue(proposal.artikelId, value - 1)}
                    aria-label={`${proposal.artikelName} verringern`}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={value}
                    disabled={pending}
                    onChange={(event) =>
                      updateValue(
                        proposal.artikelId,
                        Number(event.currentTarget.value)
                      )
                    }
                    className="h-10 text-center font-mono text-base font-semibold tabular-nums"
                    aria-label={`${proposal.artikelName} Bestand`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="touch-manipulation rounded-full"
                    disabled={pending}
                    onClick={() => updateValue(proposal.artikelId, value + 1)}
                    aria-label={`${proposal.artikelName} erhöhen`}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>

                {unchanged ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Bereits aktuell
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Ignorieren
          </Button>
          <Button type="button" disabled={pending} onClick={saveAll}>
            {pending ? "Speichern…" : "Bestände speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
