import { describe, expect, it } from "vitest";
import { parseOsvResponse } from "./osv";

describe("parseOsvResponse", () => {
  it("returns pass when no vulns", () => {
    const signal = parseOsvResponse({ vulns: [] });
    expect(signal.status).toBe("pass");
    expect(signal.count).toBe(0);
    expect(signal.maxSeverity).toBeNull();
  });

  it("flags high severity as fail", () => {
    const signal = parseOsvResponse({
      vulns: [
        {
          id: "GHSA-xxxx",
          summary: "Prototype pollution",
          database_specific: { severity: "HIGH" },
        },
      ],
    });
    expect(signal.status).toBe("fail");
    expect(signal.maxSeverity).toBe("HIGH");
    expect(signal.advisories).toHaveLength(1);
  });

  it("warns on medium severity", () => {
    const signal = parseOsvResponse({
      vulns: [
        {
          id: "GHSA-yyyy",
          database_specific: { severity: "MEDIUM" },
        },
      ],
    });
    expect(signal.status).toBe("warn");
    expect(signal.maxSeverity).toBe("MEDIUM");
  });
});
