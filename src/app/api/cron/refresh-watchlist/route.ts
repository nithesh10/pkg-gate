import { createAdminClient } from "@/lib/supabase/admin";
import { runSafetyCheck } from "@/lib/services/safety-orchestrator";
import {
  listAllWatchedPackages,
  updateWatchedPackageReport,
} from "@/lib/services/watched-packages";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid cron secret." } },
      { status: 401 }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return Response.json(
      {
        error: {
          code: "SUPABASE_NOT_CONFIGURED",
          message: "Set SUPABASE_SERVICE_ROLE_KEY for watchlist refresh.",
        },
      },
      { status: 503 }
    );
  }

  const rows = await listAllWatchedPackages(admin);
  let refreshed = 0;
  const errors: { id: string; message: string }[] = [];

  for (const row of rows) {
    try {
      const report = await runSafetyCheck(row.name, row.version);
      await updateWatchedPackageReport(admin, row.id, report);
      refreshed++;
    } catch (error) {
      errors.push({
        id: row.id,
        message: error instanceof Error ? error.message : "Refresh failed",
      });
    }
  }

  return Response.json({
    total: rows.length,
    refreshed,
    errors,
  });
}
