import { getDataSourceMode } from "@/lib/data/config"
import {
  getSupabaseProjectHost,
  hasSupabasePublicEnv,
} from "@/lib/supabase/env"

export async function GET() {
  return Response.json({
    configured: hasSupabasePublicEnv(),
    projectHost: getSupabaseProjectHost(),
    dataSource: getDataSourceMode(),
  })
}
