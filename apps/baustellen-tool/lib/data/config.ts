import { hasSupabasePublicEnv } from "@/lib/supabase/env"

export type DataSourceMode = "mock" | "supabase"

export function getDataSourceMode(): DataSourceMode {
  const configured = process.env.WBK_DATA_SOURCE?.trim().toLowerCase()

  if (configured === "mock") {
    return "mock"
  }

  if (configured === "supabase") {
    return "supabase"
  }

  return hasSupabasePublicEnv() ? "supabase" : "mock"
}

export function isMockMode(): boolean {
  return getDataSourceMode() === "mock"
}
