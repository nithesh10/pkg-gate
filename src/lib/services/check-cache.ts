import type { SafetyReport } from "./safety/types";

const TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { report: SafetyReport; expiresAt: number }>();

function cacheKey(name: string, version: string): string {
  return `${name.toLowerCase()}@${version}`;
}

export function getCachedReport(
  name: string,
  version: string
): SafetyReport | null {
  const entry = cache.get(cacheKey(name, version));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey(name, version));
    return null;
  }
  return { ...entry.report, cacheHit: true };
}

export function setCachedReport(report: SafetyReport): void {
  cache.set(cacheKey(report.name, report.version), {
    report,
    expiresAt: Date.now() + TTL_MS,
  });
}

/** Test helper */
export function clearCheckCache(): void {
  cache.clear();
}
