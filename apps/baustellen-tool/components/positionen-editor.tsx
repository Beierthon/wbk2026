"use client"

import Link from "next/link"
import { useTransition } from "react"
import { toast } from "sonner"
import { CameraIcon, Trash2Icon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { deletePosition } from "@/app/actions/positionen"
import { EINHEIT_LABELS } from "@/lib/domain/schemas"
import type { BauteilPosition } from "@/lib/domain/schemas"
import { formatMenge, formatRelative } from "@/lib/format"

export function PositionenEditor({
  positionen,
  onCreateAuftrag,
}: {
  positionen: BauteilPosition[]
  onCreateAuftrag?: (pos: BauteilPosition) => void
}) {
  const [pending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!window.confirm("Position wirklich löschen?")) return
    startTransition(async () => {
      try {
        await deletePosition(id)
        toast.success("Position gelöscht.")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Löschen fehlgeschlagen.")
      }
    })
  }

  if (positionen.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        Noch keine Positionen. Lege welche an, um Aufträge daran hängen zu können.
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Bezeichnung</th>
            <th className="px-3 py-2 text-left">Abschnitt</th>
            <th className="px-3 py-2 text-right">Soll</th>
            <th className="px-3 py-2 text-right">Ist</th>
            <th className="px-3 py-2 text-left">Letztes Update</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {positionen.map((p) => (
            <tr key={p.id} className="hover:bg-muted/30">
              <td className="px-3 py-2">
                <div className="font-medium">{p.name}</div>
                {p.beschreibung && (
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {p.beschreibung}
                  </div>
                )}
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {p.bauabschnitt || "—"}
              </td>
              <td className="px-3 py-2 text-right font-mono text-xs">
                {formatMenge(p.sollmenge, p.einheit)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-xs">
                <span
                  className={
                    p.istmenge >= p.sollmenge
                      ? "text-emerald-600"
                      : p.istmenge > 0
                      ? "text-amber-600"
                      : "text-muted-foreground"
                  }
                >
                  {formatMenge(p.istmenge, p.einheit)}
                </span>
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {p.letztes_update_am ? formatRelative(p.letztes_update_am) : "—"}
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex justify-end gap-1">
                  {onCreateAuftrag && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      title={`Auftrag zu ${EINHEIT_LABELS[p.einheit]}-Position erstellen`}
                      onClick={() => onCreateAuftrag(p)}
                    >
                      <CameraIcon />
                    </Button>
                  )}
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => handleDelete(p.id)}
                    title="Löschen"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Wrapper that combines editor + auftrag-erstellen. Kept in same file to avoid extra client boundary.
export function PositionenEditorMitAuftrag({
  positionen,
  onCreateAuftrag,
}: {
  positionen: BauteilPosition[]
  onCreateAuftrag: (pos: BauteilPosition) => void
}) {
  return <PositionenEditor positionen={positionen} onCreateAuftrag={onCreateAuftrag} />
}

export function DebugLink({ href }: { href: string }) {
  return (
    <Link className="text-xs text-muted-foreground underline" href={href}>
      Direktlink
    </Link>
  )
}
