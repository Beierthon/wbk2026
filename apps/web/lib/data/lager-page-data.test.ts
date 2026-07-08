import { describe, expect, it, beforeEach } from "vitest"

import { WBK_DEMO_PROJECT_ID } from "@workspace/domain/demo-data"

import {
  loadDemoRealtimeContext,
  loadWorkerLagerData,
} from "./lager-page-data"
import { resetMockStore } from "./mock-store"

describe("loadWorkerLagerData", () => {
  beforeEach(() => {
    resetMockStore()
    delete process.env.WBK_DATA_SOURCE
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  })

  it("returns mock lager data when Supabase is not configured", async () => {
    const data = await loadWorkerLagerData(WBK_DEMO_PROJECT_ID)
    expect(data.artikel.length).toBeGreaterThan(0)
    expect(data.aktivitaeten).toBeDefined()
  })
})

describe("loadDemoRealtimeContext", () => {
  it("returns standort and planstand ids for demo project", () => {
    const ctx = loadDemoRealtimeContext(WBK_DEMO_PROJECT_ID)
    expect(ctx.projectId).toBe(WBK_DEMO_PROJECT_ID)
    expect(ctx.standortId).not.toBe("")
    expect(ctx.planstandIds.length).toBeGreaterThan(0)
  })
})
