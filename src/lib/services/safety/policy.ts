import policyJson from "../../../../pkg-gate.policy.json";
import type { SafetyPolicy } from "./types";

const DEFAULT_POLICY: SafetyPolicy = {
  minReleaseAgeDays: 7,
  blockOnReleaseAgeFail: true,
  blockSeverities: ["CRITICAL", "HIGH"],
  warnSeverities: ["MEDIUM"],
  socketMinScore: 0.3,
  scorecardWarnBelow: 5,
};

export function loadSafetyPolicy(): SafetyPolicy {
  return { ...DEFAULT_POLICY, ...(policyJson as SafetyPolicy) };
}
