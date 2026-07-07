import type { DataSourceMode } from "./types"

export function getDataSourceMode(): DataSourceMode {
  const mode = process.env.WBK_DATA_SOURCE ?? "mock"

  if (mode === "supabase") {
    return "supabase"
  }

  return "mock"
}
