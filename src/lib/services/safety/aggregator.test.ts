import { describe, expect, it } from "vitest";
import { aggregateSafetyReport } from "./aggregator";
import type { SafetyPolicy, SafetySignals } from "./types";

const basePolicy: SafetyPolicy = {
  minReleaseAgeDays: 7,
  blockOnReleaseAgeFail: true,
  blockSeverities: ["CRITICAL", "HIGH"],
  warnSeverities: ["MEDIUM"],
  socketMinScore: 0.3,
  scorecardWarnBelow: 5,
};

function baseSignals(overrides: Partial<SafetySignals> = {}): SafetySignals {
  return {
    release_age: {
      status: "pass",
      ageDays: 30,
      minDays: 7,
      publishedAt: "2026-04-01T00:00:00.000Z",
    },
    osv: {
      status: "pass",
      count: 0,
      maxSeverity: null,
      advisories: [],
    },
    npm_audit: { status: "pass", count: 0, advisories: [] },
    deps_dev: { status: "ok", licenses: ["MIT"] },
    provenance: { status: "ok", attestations: null },
    socket: {
      status: "skipped",
      reason: "SOCKET_API_TOKEN not set",
    },
    scorecard: {
      status: "skipped",
      message: "No GitHub project link",
    },
    ...overrides,
  };
}

describe("aggregateSafetyReport", () => {
  it("returns green when all signals pass", () => {
    const report = aggregateSafetyReport({
      name: "lodash",
      version: "4.17.21",
      policy: basePolicy,
      signals: baseSignals(),
    });

    expect(report.verdict).toBe("green");
    expect(report.blocked).toBe(false);
    expect(report.blockedReasons).toHaveLength(0);
  });

  it("blocks when release age fails", () => {
    const report = aggregateSafetyReport({
      name: "fresh-pkg",
      version: "1.0.0",
      policy: basePolicy,
      signals: baseSignals({
        release_age: {
          status: "fail",
          ageDays: 2,
          minDays: 7,
          publishedAt: "2026-05-29T00:00:00.000Z",
        },
      }),
    });

    expect(report.verdict).toBe("red");
    expect(report.blocked).toBe(true);
    expect(report.blockedReasons[0]).toContain("Release age");
  });

  it("blocks on high OSV severity", () => {
    const report = aggregateSafetyReport({
      name: "vuln-pkg",
      version: "1.0.0",
      policy: basePolicy,
      signals: baseSignals({
        osv: {
          status: "fail",
          count: 1,
          maxSeverity: "HIGH",
          advisories: [{ id: "OSV-1", severity: "HIGH" }],
        },
      }),
    });

    expect(report.verdict).toBe("red");
    expect(report.blockedReasons[0]).toContain("OSV");
  });

  it("returns yellow on medium OSV without blocking", () => {
    const report = aggregateSafetyReport({
      name: "lodash",
      version: "4.17.21",
      policy: basePolicy,
      signals: baseSignals({
        osv: {
          status: "warn",
          count: 1,
          maxSeverity: "MEDIUM",
          advisories: [{ id: "OSV-2", severity: "MEDIUM" }],
        },
      }),
    });

    expect(report.verdict).toBe("yellow");
    expect(report.blocked).toBe(false);
  });
});
