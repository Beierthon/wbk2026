import Link from "next/link"
import { BriefcaseIcon, FileTextIcon } from "lucide-react"

import { BauplanUploadForm } from "@/components/bauplan-upload-form"
import { RealtimeSync } from "@/components/realtime-sync"
import { getCurrentBaustelle } from "@/lib/current-baustelle"
import { listBauplaene } from "@/lib/data/bauplaene"
import { formatRelative } from "@/lib/format"

export default async function BueroPage() {
  const baustelle = await getCurrentBaustelle()
  if (!baustelle) return null

  const bauplaene = await listBauplaene(baustelle.id)

  return (
    <>
      <RealtimeSync baustelleId={baustelle.id} channelSuffix="buero" />
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center gap-3">
          <BriefcaseIcon className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Büro</h1>
            <p className="text-sm text-muted-foreground">
              Baupläne und Projektunterlagen ablegen und bereitstellen.
            </p>
          </div>
        </header>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {bauplaene.length} Bauplan-Dokument{bauplaene.length === 1 ? "" : "e"}
          </div>
          <BauplanUploadForm baustelleId={baustelle.id} />
        </div>

        {bauplaene.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            Noch keine Baupläne hochgeladen. Nutze „Bauplan hochladen" oben rechts.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bauplaene.map((b) => (
              <Link
                key={b.id}
                href={`/buero/bauplan/${b.id}`}
                className="rounded-lg border bg-card p-4 space-y-2 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {b.dateityp.toUpperCase()} · v{b.version}
                  </span>
                </div>
                <div className="font-medium leading-tight">{b.titel}</div>
                {b.beschreibung && (
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {b.beschreibung}
                  </div>
                )}
                <div className="text-[11px] text-muted-foreground">
                  {b.hochgeladen_von || "—"} · {formatRelative(b.created_at)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
