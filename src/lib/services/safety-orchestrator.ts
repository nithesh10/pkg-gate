import { aggregateSafetyReport } from "./safety/aggregator";
import { loadSafetyPolicy } from "./safety/policy";
import type { SafetyReport, SafetySignals } from "./safety/types";
import { getCachedReport, setCachedReport } from "./check-cache";
import { fetchDepsDevVersion } from "./providers/deps-dev";
import { fetchNpmBulkAdvisories } from "./providers/npm-advisories";
import {
  fetchNpmPackageMeta,
  NpmRegistryError,
} from "./providers/npm-registry";
import { queryOsv } from "./providers/osv";
import { fetchScorecard } from "./providers/scorecard";
import { fetchSocketScore } from "./providers/socket";

const PROVIDER_TIMEOUT_MS = 8000;

async function withTimeout<T>(
  promise: Promise<T>,
  label: string
): Promise<T | { error: string }> {
  try {
    return await Promise.race([
      promise,
      new Promise<{ error: string }>((resolve) =>
        setTimeout(
          () =>
            resolve({ error: `${label} timed out after ${PROVIDER_TIMEOUT_MS}ms` }),
          PROVIDER_TIMEOUT_MS
        )
      ),
    ]);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : `${label} failed`,
    };
  }
}

export async function runSafetyCheck(
  packageName: string,
  version?: string
): Promise<SafetyReport> {
  const policy = loadSafetyPolicy();

  const npmMeta = await fetchNpmPackageMeta(
    packageName,
    version,
    policy.minReleaseAgeDays
  );

  const cached = await getCachedReport(npmMeta.name, npmMeta.version);
  if (cached) return cached;

  const [osvResult, npmAuditResult, depsDevResult, socketResult] =
    await Promise.all([
      withTimeout(queryOsv(npmMeta.name, npmMeta.version), "OSV"),
      withTimeout(
        fetchNpmBulkAdvisories(npmMeta.name, npmMeta.version),
        "npm advisories"
      ),
      withTimeout(
        fetchDepsDevVersion(npmMeta.name, npmMeta.version),
        "deps.dev"
      ),
      withTimeout(
        fetchSocketScore(npmMeta.name, npmMeta.version),
        "Socket.dev"
      ),
    ]);

  const osv =
    "error" in osvResult
      ? {
          status: "error" as const,
          count: 0,
          maxSeverity: null,
          advisories: [],
          message: osvResult.error,
        }
      : osvResult;

  const npm_audit =
    "error" in npmAuditResult
      ? {
          status: "error" as const,
          count: 0,
          advisories: [],
          message: npmAuditResult.error,
        }
      : npmAuditResult;

  const deps_dev =
    "error" in depsDevResult
      ? {
          status: "error" as const,
          licenses: [],
          message: depsDevResult.error,
        }
      : depsDevResult;

  const socket =
    "error" in socketResult
      ? {
          status: "error" as const,
          message: socketResult.error,
        }
      : socketResult;

  const scorecard = await fetchScorecard(deps_dev.project);

  const signals: SafetySignals = {
    release_age: npmMeta.releaseAge,
    osv,
    npm_audit,
    deps_dev,
    provenance: npmMeta.provenance,
    socket,
    scorecard,
  };

  const report = aggregateSafetyReport({
    name: npmMeta.name,
    version: npmMeta.version,
    signals,
    policy,
  });

  await setCachedReport(report);
  return report;
}

export { NpmRegistryError };
