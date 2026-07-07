"use server"

import { invalidateProjectCache } from "@/lib/cache/invalidate"
import { resetMockStore } from "@/lib/data/mock-store"
import { WBK_DEMO_PROJECT_ID } from "@/lib/project"

/**
 * Setzt den Mock-Store auf den Auslieferungszustand zurück (nur Mock-Modus
 * relevant). Für Live-Demos, um alle simulierten Änderungen zu verwerfen.
 */
export async function resetDemoAction() {
  resetMockStore()
  invalidateProjectCache(WBK_DEMO_PROJECT_ID)
}
