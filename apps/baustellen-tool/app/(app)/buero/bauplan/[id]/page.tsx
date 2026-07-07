import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeftIcon, DownloadIcon } from "lucide-react"

import { getBauplan } from "@/lib/data/bauplaene"
import { createClient } from "@/lib/supabase/server"
import { formatDateTime } from "@/lib/format"

export default async function BauplanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const bauplan = await getBauplan(id)
  if (!bauplan) notFound()

  const supabase = await createClient()
  const { data: signed } = await supabase.storage
    .from("bt_bauplaene")
    .createSignedUrl(bauplan.datei_pfad, 3600)
  const url = signed?.signedUrl

  const isPdf = bauplan.dateityp === "pdf"
  const isImage = ["png", "jpg", "jpeg", "webp"].includes(bauplan.dateityp)

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Link
        href="/buero"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="h-3.5 w-3.5" /> Zurück
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {bauplan.dateityp.toUpperCase()} · v{bauplan.version}
          </div>
          <h1 className="text-2xl font-semibold">{bauplan.titel}</h1>
          {bauplan.beschreibung && (
            <p className="mt-1 text-sm text-muted-foreground">
              {bauplan.beschreibung}
            </p>
          )}
          <div className="mt-1 text-xs text-muted-foreground">
            Hochgeladen von {bauplan.hochgeladen_von || "—"} am{" "}
            {formatDateTime(bauplan.created_at)}
          </div>
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-2xl border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
          >
            <DownloadIcon className="h-4 w-4" /> Öffnen / Herunterladen
          </a>
        )}
      </header>

      <section>
        {!url ? (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-destructive">
            Signierte URL konnte nicht erzeugt werden. Prüfe die Storage-Konfiguration.
          </div>
        ) : isPdf ? (
          <iframe
            src={url}
            className="h-[70vh] w-full rounded-lg border bg-card"
            title={bauplan.titel}
          />
        ) : isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={bauplan.titel}
            className="w-full rounded-lg border bg-card"
          />
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            Vorschau für Dateityp „{bauplan.dateityp}" nicht verfügbar. Nutze den
            Download-Button, um die Datei zu öffnen.
          </div>
        )}
      </section>
    </div>
  )
}
