import type { NpmAuditSignal } from "../safety/types";

type BulkResponse = Record<
  string,
  {
    id?: number;
    title?: string;
    severity?: string;
    module_name?: string;
  }[]
>;

export function parseNpmBulkAdvisories(data: BulkResponse): NpmAuditSignal {
  const key = Object.keys(data)[0];
  const advisories = (key ? data[key] : []) ?? [];

  const normalized = advisories.map((a) => ({
    id: String(a.id ?? a.title ?? "unknown"),
    title: a.title,
    severity: a.severity,
  }));

  const hasCriticalHigh = normalized.some((a) =>
    ["critical", "high"].includes((a.severity ?? "").toLowerCase())
  );
  const hasMedium = normalized.some(
    (a) => (a.severity ?? "").toLowerCase() === "moderate"
  );

  let status: NpmAuditSignal["status"] = "pass";
  if (hasCriticalHigh) status = "fail";
  else if (hasMedium || normalized.length > 0) status = "warn";

  return {
    status,
    count: normalized.length,
    advisories: normalized,
  };
}

export async function fetchNpmBulkAdvisories(
  name: string,
  version: string
): Promise<NpmAuditSignal> {
  const key = `${name}@${version}`;

  try {
    const res = await fetch(
      "https://registry.npmjs.org/-/npm/v1/security/advisories/bulk",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: version }),
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      return {
        status: "error",
        count: 0,
        advisories: [],
        message: `npm advisories API returned ${res.status}`,
      };
    }

    const data = (await res.json()) as BulkResponse;
    return parseNpmBulkAdvisories(data);
  } catch (error) {
    return {
      status: "error",
      count: 0,
      advisories: [],
      message:
        error instanceof Error
          ? error.message
          : "npm advisories fetch failed",
    };
  }
}
