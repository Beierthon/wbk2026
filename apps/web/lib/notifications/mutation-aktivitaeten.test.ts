import { describe, expect, it } from "vitest"

import type { Aktivitaet } from "@workspace/domain"

import {
  collectMutationAktivitaeten,
  mergeAktivitaeten,
} from "./mutation-aktivitaeten"

function makeAktivitaet(id: string, createdAt: string): Aktivitaet {
  return {
    id,
    createdAt,
    updatedAt: createdAt,
    projektId: "projekt-1",
    art: "material_aktualisiert",
    quelle: "bau",
    ziel: "bau",
    titel: `Activity ${id}`,
    beschreibung: "Test",
    bezug: {},
  }
}

describe("collectMutationAktivitaeten", () => {
  it("collects primary and zusatz activities", () => {
    const primary = makeAktivitaet("a1", "2026-07-08T12:00:00.000Z")
    const extra = makeAktivitaet("a2", "2026-07-08T12:01:00.000Z")

    const collected = collectMutationAktivitaeten({
      upserts: {},
      aktivitaet: primary,
      zusatzAktivitaeten: [extra],
      auditEintraege: [],
    })

    expect(collected).toEqual([primary, extra])
  })
})

describe("mergeAktivitaeten", () => {
  it("prefers server entries and deduplicates pending by id", () => {
    const server = [
      makeAktivitaet("server", "2026-07-08T12:00:00.000Z"),
      makeAktivitaet("shared", "2026-07-08T11:00:00.000Z"),
    ]
    const pending = [
      makeAktivitaet("pending", "2026-07-08T13:00:00.000Z"),
      makeAktivitaet("shared", "2026-07-08T14:00:00.000Z"),
    ]

    const merged = mergeAktivitaeten(server, pending)

    expect(merged.map((item) => item.id)).toEqual(["pending", "server", "shared"])
    expect(merged.find((item) => item.id === "shared")?.createdAt).toBe(
      "2026-07-08T11:00:00.000Z"
    )
  })
})
