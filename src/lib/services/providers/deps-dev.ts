import type { DepsDevSignal } from "../safety/types";

interface DepsDevVersionResponse {
  versionKey?: { name?: string; version?: string };
  licenses?: string[];
  links?: { label?: string; url?: string }[];
  advisories?: { url?: string }[];
  projectKey?: { id?: string };
  project?: string;
}

export function parseDepsDevVersion(data: DepsDevVersionResponse): DepsDevSignal {
  const licenses = data.licenses ?? [];
  const githubLink = data.links?.find(
    (l) => l.url?.includes("github.com") || l.label === "SOURCE_REPO"
  );
  const project =
    data.project ??
    data.projectKey?.id ??
    githubLink?.url?.replace(/^https?:\/\//, "");

  const advisoryCount = data.advisories?.length ?? 0;

  return {
    status: advisoryCount > 0 ? "warn" : licenses.length > 0 ? "ok" : "warn",
    licenses,
    project,
    message:
      licenses.length === 0
        ? "No license metadata from deps.dev"
        : undefined,
  };
}

export async function fetchDepsDevVersion(
  name: string,
  version: string
): Promise<DepsDevSignal> {
  const url = `https://api.deps.dev/v3/systems/npm/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (res.status === 404) {
      return {
        status: "skipped",
        licenses: [],
        message: "Package not indexed on deps.dev",
      };
    }

    if (!res.ok) {
      return {
        status: "error",
        licenses: [],
        message: `deps.dev returned ${res.status}`,
      };
    }

    const data = (await res.json()) as DepsDevVersionResponse;
    return parseDepsDevVersion(data);
  } catch (error) {
    return {
      status: "error",
      licenses: [],
      message:
        error instanceof Error ? error.message : "deps.dev fetch failed",
    };
  }
}
