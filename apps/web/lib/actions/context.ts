import type { AenderungsQuelle, MutationContext } from "@workspace/domain"

/**
 * Baut einen MutationContext für Server Actions. Zeit und ID-Erzeugung werden
 * hier (unrein) beschafft, damit die Domain-Commands selbst pure bleiben.
 */
export function createMutationContext(options: {
  actor: string
  quelle?: AenderungsQuelle
  geraet?: "desktop" | "mobil"
}): MutationContext {
  return {
    actor: options.actor,
    quelle: options.quelle ?? "ui",
    geraet: options.geraet,
    now: new Date().toISOString(),
    newId: (prefix) => `${prefix}-${crypto.randomUUID()}`,
  }
}

/** Liest ein Pflichtfeld aus FormData oder wirft einen deutschen Fehler. */
export function requireField(formData: FormData, name: string): string {
  const value = formData.get(name)
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Pflichtfeld fehlt: ${name}`)
  }
  return value.trim()
}

export function optionalField(
  formData: FormData,
  name: string
): string | undefined {
  const value = formData.get(name)
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined
  }
  return value.trim()
}
