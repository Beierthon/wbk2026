import { createClient } from "@supabase/supabase-js"

import { getSupabasePublicEnv } from "@/lib/supabase/env"

/** Read-only Supabase client without cookies — safe inside `use cache`. */
export function createAnonServerClient() {
  const { publishableKey, url } = getSupabasePublicEnv()
  return createClient(url, publishableKey)
}
