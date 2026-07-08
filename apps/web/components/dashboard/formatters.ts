const DISPLAY_LOCALE = "de-DE"

export function formatEuroFromCent(amountCent: number) {
  return new Intl.NumberFormat(DISPLAY_LOCALE, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amountCent / 100)
}

export function formatDisplayDate(value?: string) {
  if (!value) {
    return "—"
  }

  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

export function formatDisplayDateTime(value?: string) {
  if (!value) {
    return "—"
  }

  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

/** @deprecated Use formatDisplayDate */
export const formatGermanDate = formatDisplayDate

/** @deprecated Use formatDisplayDateTime */
export const formatGermanDateTime = formatDisplayDateTime

export function formatQuantity(value: number, einheit: string) {
  return `${new Intl.NumberFormat(DISPLAY_LOCALE).format(value)} ${einheit}`
}

export function formatPercent(value: number | null, fractionDigits = 1) {
  if (value === null) {
    return "—"
  }

  return `${new Intl.NumberFormat(DISPLAY_LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)} %`
}

export function formatRelativeTime(value?: string, now = Date.now()) {
  if (!value) {
    return "—"
  }

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) {
    return "—"
  }

  const diffMs = Math.max(0, now - timestamp)
  const diffMinutes = Math.floor(diffMs / 60_000)

  if (diffMinutes < 1) {
    return "now"
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) {
    return `${diffDays}d`
  }

  return formatDisplayDate(value)
}
