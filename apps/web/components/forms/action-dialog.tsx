"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { useState, useTransition, type ReactNode } from "react"
import { toast } from "sonner"

interface ActionDialogProps {
  triggerLabel: string
  triggerVariant?: "default" | "secondary" | "outline"
  triggerSize?: "sm" | "default"
  triggerClassName?: string
  title: string
  description?: string
  submitLabel?: string
  successMessage: string
  action: (formData: FormData) => Promise<void>
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Wiederverwendbarer Dialog mit einem Server-Action-Formular. Zeigt Pending-
 * Zustand über `useTransition`, meldet Erfolg/Fehler per Toast und schließt bei
 * Erfolg. Optimistic UI ist für die Demo bewusst weggelassen.
 */
export function ActionDialog({
  triggerLabel,
  triggerVariant = "default",
  triggerSize = "sm",
  triggerClassName,
  title,
  description,
  submitLabel = "Speichern",
  successMessage,
  action,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ActionDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen
  const [pending, startTransition] = useTransition()

  function handleAction(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData)
        toast.success(successMessage)
        setOpen(false)
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Aktion fehlgeschlagen. Bitte erneut versuchen."
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={triggerVariant}
            size={triggerSize}
            className={triggerClassName}
          />
        }
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <form action={handleAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="flex flex-col gap-3">{children}</div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Wird gespeichert…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
