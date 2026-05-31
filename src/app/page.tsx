import { PkgGate } from "@/components/pkg-gate";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { listWatchedPackages } from "@/lib/services/watched-packages";

export default async function Home() {
  const supabaseConfigured = isSupabaseConfigured();

  let initialWatched: Awaited<ReturnType<typeof listWatchedPackages>> = [];

  if (supabaseConfigured) {
    try {
      const supabase = await createClient();
      initialWatched = await listWatchedPackages(supabase);
    } catch {
      // Table may not exist until migration runs — page still works for checks.
    }
  }

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-6">
      <header className="text-center flex flex-col items-center gap-2 max-w-2xl">
        <h1 className="text-2xl font-semibold">PkgGate</h1>
        <p className="text-sm text-foreground/60">
          Multi-signal npm safety gate: release age, OSV CVEs, npm advisories,
          deps.dev licenses, and provenance — aligned with NK workspace policy.
        </p>
      </header>
      <PkgGate
        initialWatched={initialWatched}
        supabaseConfigured={supabaseConfigured}
      />
    </div>
  );
}
