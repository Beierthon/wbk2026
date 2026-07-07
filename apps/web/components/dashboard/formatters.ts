const DISPLAY_LOCALE = "en-GB"

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
