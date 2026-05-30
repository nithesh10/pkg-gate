import type { OsvAdvisorySummary, OsvSeverity, OsvSignal } from "../safety/types";

const SEVERITY_ORDER: OsvSeverity[] = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "UNKNOWN",
];

function normalizeSeverity(raw?: string): OsvSeverity {
  const upper = (raw ?? "UNKNOWN").toUpperCase();
  if (SEVERITY_ORDER.includes(upper as OsvSeverity)) {
    return upper as OsvSeverity;
  }
  return "UNKNOWN";
}

function severityFromVuln(vuln: {
  database_specific?: { severity?: string };
  severity?: { type?: string; score?: string }[];
}): OsvSeverity {
  const db = vuln.database_specific?.severity;
  if (db) return normalizeSeverity(db);
  const cvss = vuln.severity?.find((s) => s.type === "CVSS_V3");
  if (cvss?.score) {
    const score = parseFloat(cvss.score.split("/")[0] ?? "0");
    if (score >= 9) return "CRITICAL";
    if (score >= 7) return "HIGH";
    if (score >= 4) return "MEDIUM";
    return "LOW";
  }
  return "UNKNOWN";
}

export function parseOsvResponse(data: {
  vulns?: {
    id: string;
    summary?: string;
    database_specific?: { severity?: string };
    severity?: { type?: string; score?: string }[];
  }[];
}): OsvSignal {
  const vulns = data.vulns ?? [];
  const advisories: OsvAdvisorySummary[] = vulns.map((v) => ({
    id: v.id,
    summary: v.summary,
    severity: severityFromVuln(v),
  }));

  let worstSeverity: OsvSeverity | null = null;
  if (advisories.length > 0) {
    worstSeverity = advisories[0]!.severity;
    for (const advisory of advisories.slice(1)) {
      if (
        SEVERITY_ORDER.indexOf(advisory.severity) <
        SEVERITY_ORDER.indexOf(worstSeverity)
      ) {
        worstSeverity = advisory.severity;
      }
    }
  }

  const hasHigh = advisories.some((a) =>
    ["CRITICAL", "HIGH"].includes(a.severity)
  );
  const hasMedium = advisories.some((a) => a.severity === "MEDIUM");

  let status: OsvSignal["status"] = "pass";
  if (hasHigh) status = "fail";
  else if (hasMedium) status = "warn";
  else if (advisories.length > 0) status = "warn";

  return {
    status,
    count: advisories.length,
    maxSeverity: worstSeverity,
    advisories,
  };
}

export async function queryOsv(
  name: string,
  version: string
): Promise<OsvSignal> {
  try {
    const res = await fetch("https://api.osv.dev/v1/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        package: { name, ecosystem: "npm" },
        version,
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return {
        status: "error",
        count: 0,
        maxSeverity: null,
        advisories: [],
        message: `OSV API returned ${res.status}`,
      };
    }

    const data = (await res.json()) as Parameters<typeof parseOsvResponse>[0];
    return parseOsvResponse(data);
  } catch (error) {
    return {
      status: "error",
      count: 0,
      maxSeverity: null,
      advisories: [],
      message:
        error instanceof Error ? error.message : "OSV query failed",
    };
  }
}
