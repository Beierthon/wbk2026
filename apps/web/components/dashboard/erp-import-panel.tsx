"use client"

import { useRef, useState, useTransition } from "react"

import { importErpMaterialAction } from "@/lib/actions/import-actions"
import { Button } from "@workspace/ui/components/button"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"

const DEMO_JSON = `{
  "quelle": "ERP-Demo",
  "materialien": [
    {
      "materialId": "material-drainagevlies",
      "geliefert": 500,
      "verbaut": 120,
      "verbleibend": 380
    },
    {
      "materialId": "material-sauberkeitsschicht",
      "geliefert": 40,
      "verbaut": 28,
      "verbleibend": 12
    }
  ]
}`

export function ErpImportPanel({ projectId }: { projectId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await importErpMaterialAction(formData)
      setIsError(!result.ok)
      setMessage(result.message)
      if (result.ok) {
        formRef.current?.reset()
      }
    })
  }

  function downloadDemoJson() {
    const blob = new Blob([DEMO_JSON], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "wbk-erp-demo-import.json"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Mock-CSV (Material-Export-Format) oder JSON für ERP/EAP-Daten importieren.
        Es werden nur Mengenfelder übernommen — keine Secrets oder Zugangsdaten.
      </p>

      <form
        ref={formRef}
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        onSubmit={handleSubmit}
      >
        <label className="flex min-w-[10rem] flex-col gap-1.5 text-sm">
          <span className="font-medium">Format</span>
          <NativeSelect name="format" defaultValue="json">
            <NativeSelectOption value="json">JSON (ERP/EAP-Mock)</NativeSelectOption>
            <NativeSelectOption value="csv">CSV (Material-Export)</NativeSelectOption>
          </NativeSelect>
        </label>

        <label className="flex min-w-[14rem] flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium">Datei</span>
          <input
            className="text-sm file:mr-3 file:rounded-xl file:border file:px-3 file:py-1.5"
            name="file"
            type="file"
            accept=".json,.csv,application/json,text/csv"
            required
          />
        </label>

        <Button disabled={isPending} type="submit">
          {isPending ? "Importiere…" : "Importieren"}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2 text-sm">
        <button
          className="rounded-2xl border px-3 py-1.5 hover:bg-accent"
          type="button"
          onClick={downloadDemoJson}
        >
          Demo-JSON herunterladen
        </button>
        <a
          className="rounded-2xl border px-3 py-1.5 hover:bg-accent"
          href={`/api/projects/${projectId}/export/csv?entitaet=erp`}
          download
        >
          ERP-Mapping (CSV)
        </a>
      </div>

      {message ? (
        <p
          className={
            isError ? "text-sm text-destructive" : "text-sm text-muted-foreground"
          }
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
