import { ageDaysSince, isPackageAgeOk } from "../safety/release-age";
import type { ProvenanceSignal, ReleaseAgeSignal } from "../safety/types";

export class NpmRegistryError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "INVALID" | "FETCH"
  ) {
    super(message);
    this.name = "NpmRegistryError";
  }
}

export interface NpmPackageMeta {
  name: string;
  version: string;
  publishedAt: string;
  releaseAge: ReleaseAgeSignal;
  provenance: ProvenanceSignal;
}

function normalizePackageName(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidPackageName(name: string): boolean {
  return /^(@[\w.-]+\/[\w.-]+|[\w.-]+)$/.test(name);
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new NpmRegistryError(`Fetch failed: ${url}`, "FETCH");
  }
  return res.json() as Promise<T>;
}

export async function resolvePackageVersion(
  packageName: string,
  version?: string
): Promise<{ name: string; version: string }> {
  const name = normalizePackageName(packageName);
  if (!name || !isValidPackageName(name)) {
    throw new NpmRegistryError("Invalid package name", "INVALID");
  }

  if (version?.trim()) {
    return { name, version: version.trim() };
  }

  const latest = await fetchJson<{ name?: string; version?: string }>(
    `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`
  );
  if (!latest.version) {
    throw new NpmRegistryError("Latest version not available", "INVALID");
  }
  return { name: latest.name ?? name, version: latest.version };
}

export async function fetchNpmPackageMeta(
  packageName: string,
  version?: string,
  minDays = 7
): Promise<NpmPackageMeta> {
  const { name, version: resolvedVersion } = await resolvePackageVersion(
    packageName,
    version
  );

  const metaUrl = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
  const metaRes = await fetch(metaUrl, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });

  if (metaRes.status === 404) {
    throw new NpmRegistryError(`Package "${name}" not found`, "NOT_FOUND");
  }
  if (!metaRes.ok) {
    throw new NpmRegistryError("Failed to fetch package metadata", "FETCH");
  }

  const meta = (await metaRes.json()) as {
    name?: string;
    time?: Record<string, string>;
    versions?: Record<
      string,
      { dist?: { attestations?: unknown; integrity?: string } }
    >;
  };

  const publishedAt = meta.time?.[resolvedVersion];
  if (!publishedAt) {
    throw new NpmRegistryError(
      `Publish date not found for ${name}@${resolvedVersion}`,
      "INVALID"
    );
  }

  const ageDays = ageDaysSince(publishedAt);
  const ageOk = isPackageAgeOk(publishedAt, minDays);
  const versionMeta = meta.versions?.[resolvedVersion];
  const attestations = versionMeta?.dist?.attestations ?? null;

  return {
    name: meta.name ?? name,
    version: resolvedVersion,
    publishedAt,
    releaseAge: {
      status: ageOk ? "pass" : "fail",
      ageDays,
      minDays,
      publishedAt,
    },
    provenance: {
      status: attestations ? "ok" : "warn",
      attestations,
      message: attestations
        ? "npm provenance attestation present"
        : "No npm provenance attestation on this version",
    },
  };
}

/** @deprecated Use fetchNpmPackageMeta via safety-orchestrator */
export async function fetchLatestPackage(
  packageName: string,
  minDays = 7
) {
  const meta = await fetchNpmPackageMeta(packageName, undefined, minDays);
  return {
    name: meta.name,
    version: meta.version,
    publishedAt: meta.publishedAt,
    status: meta.releaseAge.status === "pass" ? ("pass" as const) : ("fail" as const),
    ageDays: meta.releaseAge.ageDays,
    minDays: meta.releaseAge.minDays,
  };
}

export { isPackageAgeOk } from "../safety/release-age";
