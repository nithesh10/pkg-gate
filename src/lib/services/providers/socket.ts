import type { SocketSignal } from "../safety/types";

interface SocketPackageScore {
  depscore?: number;
  supplyChainRisk?: { score?: number };
  vulnerability?: {
    score?: number;
    components?: Record<string, { value?: number }>;
  };
}

function countVulnerabilityIssues(data: SocketPackageScore): number {
  const components = data.vulnerability?.components ?? {};
  let count = 0;
  for (const key of Object.keys(components)) {
    if (/Issue/i.test(key) && typeof components[key]?.value === "number") {
      count += components[key]!.value as number;
    }
  }
  return count;
}

export function parseSocketScore(data: SocketPackageScore): SocketSignal {
  const score = data.depscore ?? data.supplyChainRisk?.score;
  if (score === undefined) {
    return {
      status: "error",
      message: "Socket response missing score",
    };
  }

  const issueCount = countVulnerabilityIssues(data);
  let status: SocketSignal["status"] = "ok";
  if (score < 0.3) status = "fail";
  else if (score < 0.6 || issueCount > 0) status = "warn";

  return {
    status,
    score,
    issueCount,
    message: `Socket depscore ${score.toFixed(2)}`,
  };
}

export async function fetchSocketScore(
  name: string,
  version: string
): Promise<SocketSignal> {
  const token = process.env.SOCKET_API_TOKEN;
  if (!token) {
    return {
      status: "skipped",
      reason: "SOCKET_API_TOKEN not set",
    };
  }

  const url = `https://api.socket.dev/v0/npm/${encodeURIComponent(name)}/${encodeURIComponent(version)}/score`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 3600 },
    });

    if (res.status === 404) {
      return {
        status: "skipped",
        reason: "Package not found on Socket.dev",
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        status: "error",
        message: "Socket API authentication failed",
      };
    }

    if (!res.ok) {
      return {
        status: "error",
        message: `Socket API returned ${res.status}`,
      };
    }

    const data = (await res.json()) as SocketPackageScore;
    return parseSocketScore(data);
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Socket fetch failed",
    };
  }
}
