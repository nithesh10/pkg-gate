import { describe, expect, it } from "vitest";
import { parseNpmBulkAdvisories } from "./npm-advisories";

describe("parseNpmBulkAdvisories", () => {
  it("returns pass for empty advisories", () => {
    const signal = parseNpmBulkAdvisories({ "lodash@4.17.21": [] });
    expect(signal.status).toBe("pass");
    expect(signal.count).toBe(0);
  });

  it("fails on critical advisory", () => {
    const signal = parseNpmBulkAdvisories({
      "pkg@1.0.0": [{ id: 1, title: "Critical RCE", severity: "critical" }],
    });
    expect(signal.status).toBe("fail");
    expect(signal.count).toBe(1);
  });
});
