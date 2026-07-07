import { formatGermanDate } from "@/components/dashboard/formatters"

interface VerschiebungsHistorieProps {
  bauabschnittId?: string
  verschiebungen: Array<{
    id: string
    bauabschnittId: string
    ursache: string
    strategie: string
    tageVerschoben: number
    grund: string
    zeitwirkungKumuliertTage: number
    createdAt: string
    entschiedenVon: string
  }>
  abschnittTitelById: Record<string, string>
}

export function VerschiebungsHistorie({
  bauabschnittId,
  verschiebungen,
  abschnittTitelById,
}: VerschiebungsHistorieProps) {
  const filtered = bauabschnittId
    ? verschiebungen.filter((v) => v.bauabschnittId === bauabschnittId)
    : verschiebungen

  if (filtered.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Verschiebungen dokumentiert.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {filtered.map((v) => (
        <li key={v.id} className="rounded-md border p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">
              +{v.tageVerschoben}d · {v.ursache} · {v.strategie}
            </span>
            <span className="text-muted-foreground">{formatGermanDate(v.createdAt.slice(0, 10))}</span>
          </div>
          <p className="mt-1 text-muted-foreground">{v.grund}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {abschnittTitelById[v.bauabschnittId] ?? v.bauabschnittId} · Kumuliert{" "}
            {v.zeitwirkungKumuliertTage}d · {v.entschiedenVon}
          </p>
        </li>
      ))}
    </ul>
  )
}
