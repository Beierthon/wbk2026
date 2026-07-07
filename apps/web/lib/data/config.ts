import { hasSupabasePublicEnv } from "@/lib/supabase/env"

import type { DataSourceMode } from "./types"

export function getDataSourceMode(): DataSourceMode {
  const configured = process.env.WBK_DATA_SOURCE?.trim().toLowerCase()

  if (configured === "mock") {
    return "mock"
  }

  if (configured === "supabase") {
    return "supabase"
  }

  // Default: Supabase when public env is present, otherwise mock for offline work.
  return hasSupabasePublicEnv() ? "supabase" : "mock"
}
