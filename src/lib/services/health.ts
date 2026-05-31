import type { SupabaseClient } from "@supabase/supabase-js";

export type HealthStatus = {
  ok: boolean;
  timestamp: string;
};

/** Example service — keep DB access out of components. */
export async function checkHealth(
  supabase: SupabaseClient
): Promise<HealthStatus> {
  const { error } = await supabase.from("_health").select("id").limit(1);
  return {
    ok: !error || error.code === "PGRST116",
    timestamp: new Date().toISOString(),
  };
}
