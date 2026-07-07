"use server"

import { revalidatePath } from "next/cache"

import { resetMockStore } from "@/lib/data/mock-store"

/**
 * Setzt den Mock-Store auf den Auslieferungszustand zurück (nur Mock-Modus
 * relevant). Für Live-Demos, um alle simulierten Änderungen zu verwerfen.
 */
export async function resetDemoAction() {
  resetMockStore()
  revalidatePath("/", "layout")
}
