import type {
  OsvSeverity,
  SafetyPolicy,
  SafetyReport,
  SafetySignals,
  Verdict,
} from "./types";

const SEVERITY_RANK: Record<OsvSeverity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  UNKNOWN: 0,
};

export function maxSeverity(
  severities: OsvSeverity[]
): OsvSeverity | null {
  if (severities.length === 0) return null;
  return severities.reduce((max, s) =>
    SEVERITY_RANK[s] > SEVERITY_RANK[max] ? s : max
  );
}

export function isBlockingSeverity(
  severity: OsvSeverity | null,
  policy: SafetyPolicy
): boolean {
  if (!severity) return false;
  return policy.blockSeverities.includes(severity);
}

export function isWarningSeverity(
  severity: OsvSeverity | null,
  policy: SafetyPolicy
): boolean {
  if (!severity) return false;
  return policy.warnSeverities.includes(severity);
}

export interface AggregateInput {
  name: string;
  version: string;
  signals: SafetySignals;
  policy: SafetyPolicy;
  checkedAt?: string;
  cacheHit?: boolean;
}

export function aggregateSafetyReport(input: AggregateInput): SafetyReport {
  const { name, version, signals, policy, cacheHit } = input;
  const checkedAt = input.checkedAt ?? new Date().toISOString();
  const blockedReasons: string[] = [];

  if (
    policy.blockOnReleaseAgeFail &&
    signals.release_age.status === "fail"
  ) {
    blockedReasons.push(
      `Release age ${signals.release_age.ageDays}d is below minimum ${signals.release_age.minDays}d`
    );
  }

  const osvMax = signals.osv.maxSeverity;
  if (isBlockingSeverity(osvMax, policy)) {
    blockedReasons.push(
      `OSV reports ${osvMax} severity (${signals.osv.count} advisories)`
    );
  }

  if (
    signals.npm_audit.status === "fail" ||
    (signals.npm_audit.count > 0 &&
      signals.npm_audit.advisories.some((a) =>
        ["critical", "high"].includes((a.severity ?? "").toLowerCase())
      ))
  ) {
    blockedReasons.push(
      `npm registry reports ${signals.npm_audit.count} advisory(ies)`
    );
  }

  if (
    signals.socket.status === "fail" &&
    signals.socket.score !== undefined &&
    signals.socket.score < policy.socketMinScore
  ) {
    blockedReasons.push(
      `Socket score ${signals.socket.score} below ${policy.socketMinScore}`
    );
  }

  const blocked = blockedReasons.length > 0;
  let verdict: Verdict = "green";

  if (blocked) {
    verdict = "red";
  } else if (
    isWarningSeverity(osvMax, policy) ||
    signals.npm_audit.status === "warn" ||
    signals.deps_dev.status === "warn" ||
    signals.provenance.status === "warn" ||
    signals.socket.status === "warn"
  ) {
    verdict = "yellow";
  }

  return {
    name,
    version,
    verdict,
    blocked,
    blockedReasons,
    signals,
    checkedAt,
    cacheHit,
  };
}
