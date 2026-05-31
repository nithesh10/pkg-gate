import { describe, expect, it } from "vitest";
import {
  fetchScorecard,
  githubRepoFromProject,
  parseScorecardResponse,
} from "./scorecard";

describe("githubRepoFromProject", () => {
  it("extracts owner/repo from github URL", () => {
    expect(githubRepoFromProject("github.com/lodash/lodash")).toBe(
      "lodash/lodash"
    );
    expect(
      githubRepoFromProject("https://github.com/vercel/next.js")
    ).toBe("vercel/next.js");
  });

  it("returns null for non-github projects", () => {
    expect(githubRepoFromProject("gitlab.com/foo/bar")).toBeNull();
  });
});

describe("parseScorecardResponse", () => {
  it("warns below threshold", () => {
    const signal = parseScorecardResponse({ score: 3 }, 5);
    expect(signal.status).toBe("warn");
    expect(signal.score).toBe(3);
  });

  it("skips when not indexed", () => {
    const signal = parseScorecardResponse({ error: "Not indexed" }, 5);
    expect(signal.status).toBe("skipped");
  });
});

describe("fetchScorecard", () => {
  it("skips without github project", async () => {
    const signal = await fetchScorecard(undefined);
    expect(signal.status).toBe("skipped");
  });
});
