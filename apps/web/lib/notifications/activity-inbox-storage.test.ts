import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  activityInboxDeletedStorageKey,
  activityInboxStorageKey,
  archiveAll,
  archiveId,
  deleteAll,
  deleteId,
  readArchivedIds,
  readDeletedIds,
  unarchiveId,
  writeArchivedIds,
  writeDeletedIds,
} from "@/lib/notifications/activity-inbox-storage"

const PROJECT_ID = "projekt-campus-west"

function createLocalStorageMock() {
  const store = new Map<string, string>()

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
}

function clearStorage() {
  localStorage.removeItem(activityInboxStorageKey(PROJECT_ID))
  localStorage.removeItem(activityInboxDeletedStorageKey(PROJECT_ID))
}

beforeEach(() => {
  const storage = createLocalStorageMock()
  vi.stubGlobal("localStorage", storage)
  vi.stubGlobal("window", { localStorage: storage })
})

afterEach(() => {
  clearStorage()
  vi.unstubAllGlobals()
})

describe("activityInboxStorageKey", () => {
  it("scopes storage by project id", () => {
    expect(activityInboxStorageKey(PROJECT_ID)).toBe(
      "wbk-activity-inbox:v1:projekt-campus-west"
    )
  })
})

describe("activityInboxDeletedStorageKey", () => {
  it("scopes deleted storage by project id", () => {
    expect(activityInboxDeletedStorageKey(PROJECT_ID)).toBe(
      "wbk-activity-inbox-deleted:v1:projekt-campus-west"
    )
  })
})

describe("readArchivedIds", () => {
  afterEach(clearStorage)

  it("returns an empty list when nothing is stored", () => {
    expect(readArchivedIds(PROJECT_ID)).toEqual([])
  })

  it("deduplicates stored ids", () => {
    writeArchivedIds(PROJECT_ID, ["a", "a", "b"])
    expect(readArchivedIds(PROJECT_ID)).toEqual(["a", "b"])
  })

  it("returns an empty list for invalid json", () => {
    localStorage.setItem(activityInboxStorageKey(PROJECT_ID), "{not-json")
    expect(readArchivedIds(PROJECT_ID)).toEqual([])
  })
})

describe("readDeletedIds", () => {
  afterEach(clearStorage)

  it("returns an empty list when nothing is stored", () => {
    expect(readDeletedIds(PROJECT_ID)).toEqual([])
  })

  it("deduplicates stored ids", () => {
    writeDeletedIds(PROJECT_ID, ["a", "a", "b"])
    expect(readDeletedIds(PROJECT_ID)).toEqual(["a", "b"])
  })
})

describe("archiveId", () => {
  afterEach(clearStorage)

  it("appends a new id and persists it", () => {
    const next = archiveId(PROJECT_ID, [], "aktivitaet-1")
    expect(next).toEqual(["aktivitaet-1"])
    expect(readArchivedIds(PROJECT_ID)).toEqual(["aktivitaet-1"])
  })

  it("does not duplicate existing ids", () => {
    const next = archiveId(PROJECT_ID, ["aktivitaet-1"], "aktivitaet-1")
    expect(next).toEqual(["aktivitaet-1"])
  })
})

describe("archiveAll", () => {
  afterEach(clearStorage)

  it("merges ids without duplicates", () => {
    const next = archiveAll(
      PROJECT_ID,
      ["aktivitaet-1"],
      ["aktivitaet-2", "aktivitaet-1", "aktivitaet-3"]
    )
    expect(next).toEqual(["aktivitaet-1", "aktivitaet-2", "aktivitaet-3"])
    expect(readArchivedIds(PROJECT_ID)).toEqual(next)
  })
})

describe("unarchiveId", () => {
  afterEach(clearStorage)

  it("removes an id and persists the result", () => {
    const next = unarchiveId(
      PROJECT_ID,
      ["aktivitaet-1", "aktivitaet-2"],
      "aktivitaet-1"
    )
    expect(next).toEqual(["aktivitaet-2"])
    expect(readArchivedIds(PROJECT_ID)).toEqual(["aktivitaet-2"])
  })
})

describe("deleteId", () => {
  afterEach(clearStorage)

  it("adds an id to deleted storage and removes it from archive", () => {
    const next = deleteId(
      PROJECT_ID,
      [],
      ["aktivitaet-1", "aktivitaet-2"],
      "aktivitaet-1"
    )
    expect(next).toEqual({
      deletedIds: ["aktivitaet-1"],
      archivedIds: ["aktivitaet-2"],
    })
    expect(readDeletedIds(PROJECT_ID)).toEqual(["aktivitaet-1"])
    expect(readArchivedIds(PROJECT_ID)).toEqual(["aktivitaet-2"])
  })

  it("does not duplicate deleted ids", () => {
    const next = deleteId(
      PROJECT_ID,
      ["aktivitaet-1"],
      ["aktivitaet-1"],
      "aktivitaet-1"
    )
    expect(next.deletedIds).toEqual(["aktivitaet-1"])
  })
})

describe("deleteAll", () => {
  afterEach(clearStorage)

  it("merges deleted ids and clears them from archive", () => {
    const next = deleteAll(
      PROJECT_ID,
      ["aktivitaet-1"],
      ["aktivitaet-2", "aktivitaet-3", "aktivitaet-4"],
      ["aktivitaet-2", "aktivitaet-3"]
    )
    expect(next).toEqual({
      deletedIds: ["aktivitaet-1", "aktivitaet-2", "aktivitaet-3"],
      archivedIds: ["aktivitaet-4"],
    })
    expect(readDeletedIds(PROJECT_ID)).toEqual(next.deletedIds)
    expect(readArchivedIds(PROJECT_ID)).toEqual(["aktivitaet-4"])
  })
})
