export function formatEuroFromCent(amountCent: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amountCent / 100)
}

export function formatGermanDate(value?: string) {
  if (!value) {
    return "—"
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

export function formatGermanDateTime(value?: string) {
  if (!value) {
    return "—"
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function formatQuantity(value: number, einheit: string) {
  return `${new Intl.NumberFormat("de-DE").format(value)} ${einheit}`
}
