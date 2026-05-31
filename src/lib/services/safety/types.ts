export type SignalStatus =
  | "pass"
  | "warn"
  | "fail"
  | "ok"
  | "skipped"
  | "error";

export type Verdict = "green" | "yellow" | "red";

export type OsvSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export interface ReleaseAgeSignal {
  status: "pass" | "fail" | "error";
  ageDays: number;
  minDays: number;
  publishedAt?: string;
  message?: string;
}

export interface OsvAdvisorySummary {
  id: string;
  summary?: string;
  severity: OsvSeverity;
}

export interface OsvSignal {
  status: SignalStatus;
  count: number;
  maxSeverity: OsvSeverity | null;
  advisories: OsvAdvisorySummary[];
  message?: string;
}

export interface NpmAuditSignal {
  status: SignalStatus;
  count: number;
  advisories: { id: string; title?: string; severity?: string }[];
  message?: string;
}

export interface DepsDevSignal {
  status: SignalStatus;
  licenses: string[];
  project?: string;
  message?: string;
}

export interface ProvenanceSignal {
  status: SignalStatus;
  attestations: unknown | null;
  message?: string;
}

export interface SocketSignal {
  status: SignalStatus;
  score?: number;
  issueCount?: number;
  reason?: string;
  message?: string;
}

export interface ScorecardSignal {
  status: SignalStatus;
  score?: number;
  message?: string;
}

export interface SafetySignals {
  release_age: ReleaseAgeSignal;
  osv: OsvSignal;
  npm_audit: NpmAuditSignal;
  deps_dev: DepsDevSignal;
  provenance: ProvenanceSignal;
  socket: SocketSignal;
  scorecard: ScorecardSignal;
}

export interface SafetyReport {
  name: string;
  version: string;
  verdict: Verdict;
  blocked: boolean;
  blockedReasons: string[];
  signals: SafetySignals;
  checkedAt: string;
  cacheHit?: boolean;
}

export interface SafetyPolicy {
  minReleaseAgeDays: number;
  blockOnReleaseAgeFail: boolean;
  blockSeverities: OsvSeverity[];
  warnSeverities: OsvSeverity[];
  socketMinScore: number;
  scorecardWarnBelow: number;
}
