import { describe, expect, it } from "vitest";
import { parseDepsDevVersion } from "./deps-dev";

describe("parseDepsDevVersion", () => {
  it("parses licenses and github project", () => {
    const signal = parseDepsDevVersion({
      licenses: ["MIT"],
      links: [{ url: "https://github.com/lodash/lodash", label: "SOURCE_REPO" }],
      advisories: [],
    });

    expect(signal.status).toBe("ok");
    expect(signal.licenses).toEqual(["MIT"]);
    expect(signal.project).toContain("github.com/lodash/lodash");
  });

  it("warns when advisories present", () => {
    const signal = parseDepsDevVersion({
      licenses: ["MIT"],
      advisories: [{ url: "https://example.com/adv" }],
    });

    expect(signal.status).toBe("warn");
  });
});
