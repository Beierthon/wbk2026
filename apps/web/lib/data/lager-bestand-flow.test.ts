import { describe, expect, it, beforeEach } from "vitest"

import { aktualisiereLagerArtikel, loescheLagerArtikel } from "@workspace/domain"
import { WBK_DEMO_PROJECT_ID } from "@workspace/domain/demo-data"

import { applyMutationToStore } from "./apply-mutation"
import { getMockStore, resetMockStore } from "./mock-store"

function makeCtx() {
  let counter = 0
  return {
    actor: "Test",
    quelle: "ui" as const,
    geraet: "desktop" as const,
    now: "2026-07-08T12:00:00.000Z",
    newId: (prefix: string) => `${prefix}-${++counter}`,
  }
}

function makeVisionCtx() {
  let counter = 0
  return {
    actor: "Lager Vision",
    quelle: "vision" as const,
    geraet: "mobil" as const,
    now: "2026-07-08T12:00:00.000Z",
    newId: (prefix: string) => `${prefix}-${++counter}`,
  }
}

describe("lager bestand flow (mock store)", () => {
  beforeEach(() => {
    resetMockStore()
  })

  it("increases stock and appends inbox activities", () => {
    const store = getMockStore()
    const apfel = store.lagerArtikel.find((item) => item.id === "lager-apfel")
    expect(apfel).toBeDefined()

    const beforeCount = store.aktivitaeten.length
    const result = aktualisiereLagerArtikel(
      {
        projektId: WBK_DEMO_PROJECT_ID,
        artikel: apfel!,
        neuerBestand: apfel!.aktuell + 1,
      },
      makeCtx()
    )
    applyMutationToStore(store, result)

    const updated = store.lagerArtikel.find((item) => item.id === "lager-apfel")
    expect(updated?.aktuell).toBe(3)
    expect(store.aktivitaeten.length).toBeGreaterThan(beforeCount)
    expect(store.aktivitaeten[0]?.titel).toContain("Apfel")
  })

  it("decreases stock to mindestbestand and creates reorder notification", () => {
    const store = getMockStore()
    const apfel = store.lagerArtikel.find((item) => item.id === "lager-apfel")!

    const result = aktualisiereLagerArtikel(
      {
        projektId: WBK_DEMO_PROJECT_ID,
        artikel: apfel,
        neuerBestand: apfel.mindestbestand,
      },
      makeCtx()
    )
    applyMutationToStore(store, result)

    const titles = store.aktivitaeten
      .slice(0, 3)
      .map((aktivitaet) => aktivitaet.titel)
    expect(titles.some((title) => title.includes("Nachbestellen"))).toBe(true)
  })

  it("clamps overstock and records over-limit activity", () => {
    const store = getMockStore()
    const bananen = store.lagerArtikel.find(
      (item) => item.id === "lager-bananen"
    )!

    const result = aktualisiereLagerArtikel(
      {
        projektId: WBK_DEMO_PROJECT_ID,
        artikel: bananen,
        neuerBestand: bananen.maximal + 2,
      },
      makeCtx()
    )
    applyMutationToStore(store, result)

    const updated = store.lagerArtikel.find(
      (item) => item.id === "lager-bananen"
    )
    expect(updated?.aktuell).toBe(bananen.maximal)
    expect(
      store.aktivitaeten
        .slice(0, 3)
        .some((aktivitaet) => aktivitaet.titel.includes("Überbestand"))
    ).toBe(true)
  })

  it("records vision-originated lager changes in activity and audit", () => {
    const store = getMockStore()
    const apfel = store.lagerArtikel.find((item) => item.id === "lager-apfel")!

    const result = aktualisiereLagerArtikel(
      {
        projektId: WBK_DEMO_PROJECT_ID,
        artikel: apfel,
        neuerBestand: apfel.aktuell + 1,
      },
      makeVisionCtx()
    )
    applyMutationToStore(store, result)

    expect(result.aktivitaet.quelle).toBe("vision")
    expect(result.auditEintraege[0]?.quelle).toBe("vision")
    expect(result.auditEintraege[0]?.actor).toBe("Lager Vision")
  })

  it("deletes a warehouse item from the mock store", () => {
    const store = getMockStore()
    const apfel = store.lagerArtikel.find((item) => item.id === "lager-apfel")!

    const result = loescheLagerArtikel(
      { projektId: WBK_DEMO_PROJECT_ID, artikel: apfel },
      makeCtx()
    )
    applyMutationToStore(store, result)

    expect(
      store.lagerArtikel.find((item) => item.id === "lager-apfel")
    ).toBeUndefined()
    expect(store.aktivitaeten[0]?.titel).toContain("gelöscht")
  })
})
