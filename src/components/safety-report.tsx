import type { SafetyReport, SafetySignals, Verdict } from "@/lib/services/safety/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const VERDICT_STYLES: Record<
  Verdict,
  { label: string; className: string; emoji: string }
> = {
  green: {
    label: "OK",
    emoji: "🟢",
    className: "border-green-500/40 bg-green-500/10",
  },
  yellow: {
    label: "Review",
    emoji: "🟡",
    className: "border-yellow-500/40 bg-yellow-500/10",
  },
  red: {
    label: "Block",
    emoji: "🔴",
    className: "border-red-500/40 bg-red-500/10",
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SignalRow({
  title,
  status,
  detail,
}: {
  title: string;
  status: string;
  detail: string;
}) {
  return (
    <div className="rounded border border-foreground/10 p-3 text-sm">
      <div className="flex justify-between gap-2 font-medium">
        <span>{title}</span>
        <span className="uppercase text-xs text-foreground/60">{status}</span>
      </div>
      <p className="mt-1 text-foreground/70">{detail}</p>
    </div>
  );
}

function signalDetails(signals: SafetySignals): {
  title: string;
  status: string;
  detail: string;
}[] {
  return [
    {
      title: "Release age (7-day rule)",
      status: signals.release_age.status,
      detail: `${signals.release_age.ageDays} days old (min ${signals.release_age.minDays})`,
    },
    {
      title: "OSV vulnerabilities",
      status: signals.osv.status,
      detail:
        signals.osv.count === 0
          ? "No known CVEs for this version"
          : `${signals.osv.count} advisory(ies), max ${signals.osv.maxSeverity ?? "unknown"}`,
    },
    {
      title: "npm registry advisories",
      status: signals.npm_audit.status,
      detail:
        signals.npm_audit.count === 0
          ? "No npm bulk advisories"
          : `${signals.npm_audit.count} advisory(ies)`,
    },
    {
      title: "deps.dev enrichment",
      status: signals.deps_dev.status,
      detail:
        signals.deps_dev.licenses.length > 0
          ? `Licenses: ${signals.deps_dev.licenses.join(", ")}${signals.deps_dev.project ? ` · ${signals.deps_dev.project}` : ""}`
          : (signals.deps_dev.message ?? "No license metadata"),
    },
    {
      title: "npm provenance",
      status: signals.provenance.status,
      detail: signals.provenance.message ?? "Unknown",
    },
    {
      title: "Socket.dev (behavioral)",
      status: signals.socket.status,
      detail:
        signals.socket.reason ??
        signals.socket.message ??
        "Not configured",
    },
  ];
}

export function SafetyReportView({ report }: { report: SafetyReport }) {
  const style = VERDICT_STYLES[report.verdict];

  return (
    <div className={`rounded-md border p-4 ${style.className}`}>
      <p className="text-lg font-semibold">
        {style.emoji} {style.label}
        {report.blocked && (
          <span className="ml-2 text-sm font-normal text-red-700">Blocked</span>
        )}
      </p>

      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-foreground/60">Package</dt>
        <dd>
          {report.name}@{report.version}
        </dd>
        <dt className="text-foreground/60">Published</dt>
        <dd>
          {report.signals.release_age.publishedAt
            ? formatDate(report.signals.release_age.publishedAt)
            : "—"}
        </dd>
        <dt className="text-foreground/60">Checked</dt>
        <dd>{formatDate(report.checkedAt)}</dd>
        {report.cacheHit && (
          <>
            <dt className="text-foreground/60">Cache</dt>
            <dd>Hit (24h TTL)</dd>
          </>
        )}
      </dl>

      {report.blockedReasons.length > 0 && (
        <ul className="mt-3 list-disc pl-5 text-sm text-red-800">
          {report.blockedReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {signalDetails(report.signals).map((s) => (
          <SignalRow key={s.title} {...s} />
        ))}
      </div>
    </div>
  );
}

export function SafetyReportCard({
  report,
  onSave,
  saving,
  canSave,
}: {
  report: SafetyReport;
  onSave?: () => void;
  saving?: boolean;
  canSave?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-signal safety report</CardTitle>
        <CardDescription>
          Release age, OSV, npm advisories, deps.dev, and provenance — worst
          signal wins.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SafetyReportView report={report} />
        {canSave && onSave && (
          <button
            type="button"
            className="inline-flex w-fit rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save to watchlist"}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
