"use client"

import { useState } from "react"

import { KonfliktKommentarDialog } from "@/components/forms/muss-flow-forms"

import { KonfliktStatusTouchButtons } from "./konflikt-status-touch"

export function KonfliktBaustellenKarte({
  konfliktId,
  status,
}: {
  konfliktId: string
  status: Parameters<typeof KonfliktStatusTouchButtons>[0]["status"]
}) {
  const [kommentarOpen, setKommentarOpen] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <KonfliktStatusTouchButtons
        konfliktId={konfliktId}
        status={status}
        onRueckfrage={() => setKommentarOpen(true)}
      />
      <KonfliktKommentarDialog
        konfliktId={konfliktId}
        rolle="bau"
        triggerLabel="Kommentieren"
        triggerClassName="h-11 w-full rounded-2xl"
        open={kommentarOpen}
        onOpenChange={setKommentarOpen}
        showFotoPlatzhalter
      />
    </div>
  )
}
