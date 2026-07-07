"use client"

import { WifiOff } from "lucide-react"
import { useEffect, useState } from "react"

/**
 * Zeigt einen Hinweis, wenn die Verbindung schlecht/offline ist – auf der
 * Baustelle ein häufiger UX-Zustand (#25).
 */
export function OfflineHinweis() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => {
      window.removeEventListener("online", on)
      window.removeEventListener("offline", off)
    }
  }, [])

  if (online) {
    return null
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
      <WifiOff className="size-4 shrink-0" />
      <span>
        Keine Verbindung. Meldungen werden erst nach erneuter Verbindung
        übertragen.
      </span>
    </div>
  )
}
