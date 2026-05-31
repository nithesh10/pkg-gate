import { createAdminClient } from "@/lib/supabase/admin";
import type { SafetyReport } from "./safety/types";

const TTL_MS = 24 * 60 * 60 * 1000;
const memoryCache = new Map<string, { report: SafetyReport; expiresAt: number }>();

function cacheKey(name: string, version: string): string {
  return `${name.toLowerCase()}@${version}`;
}

function isExpired(expiresAt: string | number): boolean {
  const ts = typeof expiresAt === "string" ? Date.parse(expiresAt) : expiresAt;
  return Date.now() > ts;
}

export async function getCachedReport(
  name: string,
  version: string
): Promise<SafetyReport | null> {
  const key = cacheKey(name, version);
  const memory = memoryCache.get(key);
  if (memory && !isExpired(memory.expiresAt)) {
    return { ...memory.report, cacheHit: true };
  }
  if (memory) memoryCache.delete(key);

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("package_checks_cache")
    .select("report_json, expires_at")
    .eq("package_name", name.toLowerCase())
    .eq("package_version", version)
    .maybeSingle();

  if (error || !data || isExpired(data.expires_at)) return null;

  const report = data.report_json as SafetyReport;
  return { ...report, cacheHit: true };
}

export async function setCachedReport(report: SafetyReport): Promise<void> {
  const key = cacheKey(report.name, report.version);
  const expiresAt = Date.now() + TTL_MS;

  memoryCache.set(key, { report, expiresAt });

  const admin = createAdminClient();
  if (!admin) return;

  const expiresIso = new Date(expiresAt).toISOString();
  await admin.from("package_checks_cache").upsert(
    {
      package_name: report.name.toLowerCase(),
      package_version: report.version,
      report_json: report,
      checked_at: report.checkedAt,
      expires_at: expiresIso,
    },
    { onConflict: "package_name,package_version" }
  );
}

/** Test helper */
export function clearCheckCache(): void {
  memoryCache.clear();
}
