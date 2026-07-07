export function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d)
  } catch {
    return iso
  }
}

export function formatRelative(iso: string): string {
  try {
    const then = new Date(iso).getTime()
    const now = Date.now()
    const diffSeconds = Math.round((then - now) / 1000)
    const absSeconds = Math.abs(diffSeconds)
    const rtf = new Intl.RelativeTimeFormat("de-DE", { numeric: "auto" })
    if (absSeconds < 60) return rtf.format(diffSeconds, "second")
    if (absSeconds < 3600) return rtf.format(Math.round(diffSeconds / 60), "minute")
    if (absSeconds < 86400) return rtf.format(Math.round(diffSeconds / 3600), "hour")
    return rtf.format(Math.round(diffSeconds / 86400), "day")
  } catch {
    return iso
  }
}

export function formatMenge(value: number | null | undefined, einheit: string | null | undefined): string {
  if (value == null) return "—"
  const nf = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 })
  const unit = einheit ? ` ${unitLabel(einheit)}` : ""
  return `${nf.format(value)}${unit}`
}

function unitLabel(e: string): string {
  switch (e) {
    case "stueck": return "Stk"
    case "m2": return "m²"
    case "m3": return "m³"
    case "prozent": return "%"
    default: return e
  }
}
