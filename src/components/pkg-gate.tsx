"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SafetyReportCard } from "@/components/safety-report";
import type { SafetyReport } from "@/lib/services/safety/types";
import type { WatchedPackageRow } from "@/lib/services/watched-packages";

type Props = {
  initialWatched: WatchedPackageRow[];
  supabaseConfigured: boolean;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function verdictBadgeClass(verdict: string): string {
  if (verdict === "green") return "text-green-600 font-medium";
  if (verdict === "yellow") return "text-yellow-600 font-medium";
  return "text-red-600 font-medium";
}

export function PkgGate({ initialWatched, supabaseConfigured }: Props) {
  const [packageName, setPackageName] = useState("");
  const [version, setVersion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SafetyReport | null>(null);
  const [watched, setWatched] = useState(initialWatched);
  const [saving, setSaving] = useState(false);

  const checkPackage = useCallback(async () => {
    const name = packageName.trim();
    if (!name) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({ name });
      if (version.trim()) params.set("version", version.trim());
      const res = await fetch(`/api/check?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Check failed.");
        return;
      }
      setResult(data as SafetyReport);
    } catch {
      setError("Network error while checking package.");
    } finally {
      setLoading(false);
    }
  }, [packageName, version]);

  const saveToWatchlist = useCallback(async () => {
    if (!result || !supabaseConfigured) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/watched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: result }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Save failed.");
        return;
      }
      setWatched((prev) => {
        const next = prev.filter((p) => p.name !== data.package.name);
        return [data.package as WatchedPackageRow, ...next];
      });
    } catch {
      setError("Network error while saving package.");
    } finally {
      setSaving(false);
    }
  }, [result, supabaseConfigured]);

  const removeFromWatchlist = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/watched?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message ?? "Delete failed.");
        return;
      }
      setWatched((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Network error while removing package.");
    }
  }, []);

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Check package safety</CardTitle>
          <CardDescription>
            Multi-signal check: 7-day release age, OSV, npm advisories, deps.dev,
            provenance, Scorecard, and Socket. Sign in to save to watchlist.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Package name (e.g. lodash)"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void checkPackage()}
              aria-label="Package name"
            />
            <Input
              placeholder="Version (optional)"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="sm:w-40"
              aria-label="Version"
            />
            <Button
              onClick={() => void checkPackage()}
              disabled={loading || !packageName.trim()}
            >
              {loading ? "Checking…" : "Check"}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {result && (
            <SafetyReportCard
              report={result}
              canSave={supabaseConfigured}
              onSave={() => void saveToWatchlist()}
              saving={saving}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Watched packages</CardTitle>
          <CardDescription>
            {supabaseConfigured
              ? "Full safety report snapshots in Supabase."
              : "Configure Supabase env vars to persist watchlist."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {watched.length === 0 ? (
            <p className="text-sm text-foreground/60">No packages saved yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-foreground/60">
                    <th className="pb-2 pr-4 font-medium">Package</th>
                    <th className="pb-2 pr-4 font-medium">Version</th>
                    <th className="pb-2 pr-4 font-medium">Verdict</th>
                    <th className="pb-2 pr-4 font-medium">Checked</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {watched.map((pkg) => (
                    <tr key={pkg.id} className="border-b border-foreground/5">
                      <td className="py-2 pr-4 font-mono">{pkg.name}</td>
                      <td className="py-2 pr-4">{pkg.version}</td>
                      <td className="py-2 pr-4">
                        <span className={verdictBadgeClass(pkg.verdict)}>
                          {pkg.verdict.toUpperCase()}
                          {pkg.blocked ? " · BLOCKED" : ""}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        {formatDate(pkg.last_checked_at ?? pkg.created_at)}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="outline"
                          className="px-3 py-1.5 text-xs"
                          onClick={() => void removeFromWatchlist(pkg.id)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
