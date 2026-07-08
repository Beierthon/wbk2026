export type ActivityInboxLocale = "de" | "en"

export function activityInboxCopy(locale: ActivityInboxLocale) {
  if (locale === "de") {
    return {
      inbox: "Posteingang",
      archive: "Archiv",
      archiveOne: "Archivieren",
      restore: "Wiederherstellen",
      deleteOne: "Löschen",
      archiveAll: "Alle archivieren",
      deleteAll: "Alle löschen",
      inboxEmpty: "Keine aktuellen Meldungen.",
      archiveEmpty: "Kein Archiv.",
      openLog: "Aktivitäten öffnen",
    }
  }

  return {
    inbox: "Inbox",
    archive: "Archive",
    archiveOne: "Archive",
    restore: "Restore",
    deleteOne: "Delete",
    archiveAll: "Archive all",
    deleteAll: "Delete all",
    inboxEmpty: "No current project events.",
    archiveEmpty: "No archived events.",
    openLog: "Open log",
  }
}
