"use client"

import { useState, useTransition, type ReactNode } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { useSwipeToReveal } from "@/hooks/use-swipe-to-reveal"

interface LagerSwipeDeleteRowProps {
  artikelName: string
  onDelete: () => Promise<void>
  onOpenChange?: (open: boolean) => void
  className?: string
  children: ReactNode
}

export function LagerSwipeDeleteRow({
  artikelName,
  onDelete,
  onOpenChange,
  className,
  children,
}: LagerSwipeDeleteRowProps) {
  const { rootRef, offset, open, close, revealWidth } = useSwipeToReveal()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleConfirmOpenChange(next: boolean) {
    setConfirmOpen(next)
    onOpenChange?.(next)
    if (!next) {
      close()
    }
  }

  function requestDelete() {
    setConfirmOpen(true)
    onOpenChange?.(true)
  }

  function confirmDelete() {
    startTransition(async () => {
      try {
        await onDelete()
        handleConfirmOpenChange(false)
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Artikel konnte nicht gelöscht werden"
        )
      }
    })
  }

  return (
    <>
      <div
        ref={rootRef}
        className={cn("relative overflow-hidden rounded-xl", className)}
      >
        <div
          className="absolute inset-y-0 right-0 flex items-stretch"
          style={{ width: revealWidth }}
          aria-hidden={!open}
        >
          <Button
            type="button"
            variant="destructive"
            className="h-full w-full touch-manipulation rounded-none rounded-r-xl px-0"
            onClick={requestDelete}
            aria-label={`${artikelName} löschen`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div
          className={cn(
            "relative bg-inherit motion-reduce:transition-none",
            offset === 0 || offset === revealWidth
              ? "transition-transform duration-150 ease-out"
              : ""
          )}
          style={{ transform: `translateX(-${offset}px)` }}
        >
          {children}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={handleConfirmOpenChange}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Artikel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {artikelName} wird aus dem Lager entfernt. Der Bestand geht
              verloren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={confirmDelete}
            >
              {pending ? "Löschen…" : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
