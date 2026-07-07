import type { BauprojektDatenmodell } from "@workspace/domain"
import { WBK_DEMO_DATA } from "@workspace/domain/demo-data"

/**
 * Mutierbarer In-Memory-Store für den Mock-Modus. Über `globalThis` gehalten,
 * damit Schreibvorgänge Navigationen und Next-Dev-HMR überleben (analog zum
 * Prisma-Client-Pattern). Auf serverlosen Instanzen hat jede Instanz ihren
 * eigenen Store – für die Demo akzeptabel; "Demo zurücksetzen" stellt den
 * Auslieferungszustand wieder her.
 */
const globalForWbk = globalThis as unknown as {
  __wbkMockStore?: BauprojektDatenmodell
}

export function getMockStore(): BauprojektDatenmodell {
  if (!globalForWbk.__wbkMockStore) {
    globalForWbk.__wbkMockStore = structuredClone(WBK_DEMO_DATA)
  }

  return globalForWbk.__wbkMockStore
}

export function resetMockStore(): void {
  globalForWbk.__wbkMockStore = structuredClone(WBK_DEMO_DATA)
}

interface Identifiable {
  id: string
}

/** Upsert nach id: ersetzt vorhandene Einträge, hängt neue an. */
export function upsertById<T extends Identifiable>(
  collection: T[],
  items: readonly T[]
): void {
  for (const item of items) {
    const index = collection.findIndex((existing) => existing.id === item.id)
    if (index >= 0) {
      collection[index] = item
    } else {
      collection.push(item)
    }
  }
}
