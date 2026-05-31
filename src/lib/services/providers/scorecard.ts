import type { ScorecardSignal } from "../safety/types";
import { loadSafetyPolicy } from "../safety/policy";

interface ScorecardResponse {
  score?: number;
  date?: string;
  error?: string;
}

export function parseScorecardResponse(
  data: ScorecardResponse,
  warnBelow: number
): ScorecardSignal {
  if (data.error || data.score === undefined) {
    return {
      status: "skipped",
      message: data.error ?? "Repository not indexed by OpenSSF Scorecard",
    };
  }

  const status = data.score < warnBelow ? "warn" : "ok";
  return {
    status,
    score: data.score,
    message: `OpenSSF Scorecard ${data.score}/10`,
  };
}

/** Parse github.com/owner/repo from deps.dev project string */
export function githubRepoFromProject(project?: string): string | null {
  if (!project) return null;
  const normalized = project.replace(/^https?:\/\//, "");
  const match = normalized.match(/github\.com\/([^/]+\/[^/]+)/i);
  return match ? match[1]! : null;
}

export async function fetchScorecard(
  project?: string
): Promise<ScorecardSignal> {
  const repo = githubRepoFromProject(project);
  if (!repo) {
    return {
      status: "skipped",
      message: "No GitHub project link from deps.dev",
    };
  }

  const policy = loadSafetyPolicy();
  const [owner, repoName] = repo.split("/");
  const url = `https://api.securityscorecards.dev/projects/github.com/${encodeURIComponent(owner!)}/${encodeURIComponent(repoName!)}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (res.status === 404) {
      return parseScorecardResponse(
        { error: "Not indexed" },
        policy.scorecardWarnBelow
      );
    }

    if (!res.ok) {
      return {
        status: "error",
        message: `Scorecard API returned ${res.status}`,
      };
    }

    const data = (await res.json()) as ScorecardResponse;
    return parseScorecardResponse(data, policy.scorecardWarnBelow);
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Scorecard fetch failed",
    };
  }
}
