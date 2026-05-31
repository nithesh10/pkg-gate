import { describe, expect, it } from "vitest";
import { parseSocketScore } from "./socket";

describe("parseSocketScore", () => {
  it("returns ok for high depscore", () => {
    const signal = parseSocketScore({ depscore: 0.85 });
    expect(signal.status).toBe("ok");
    expect(signal.score).toBe(0.85);
  });

  it("returns fail for low depscore", () => {
    const signal = parseSocketScore({ depscore: 0.2 });
    expect(signal.status).toBe("fail");
  });

  it("returns warn when vulnerability issues exist", () => {
    const signal = parseSocketScore({
      depscore: 0.7,
      vulnerability: {
        components: { vulnerabilityIssueHigh: { value: 2 } },
      },
    });
    expect(signal.status).toBe("warn");
    expect(signal.issueCount).toBe(2);
  });
});
