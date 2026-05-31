import type { SupabaseClient } from "@supabase/supabase-js";
import type { SafetyReport } from "./safety/types";

export type WatchedPackageRow = {
  id: string;
  name: string;
  version: string;
  published_at: string;
  status: "pass" | "fail" | "warn";
  verdict: "green" | "yellow" | "red";
  blocked: boolean;
  signals_json: SafetyReport["signals"] | null;
  last_checked_at: string | null;
  user_id: string | null;
  created_at: string;
};

export async function listWatchedPackages(
  supabase: SupabaseClient
): Promise<WatchedPackageRow[]> {
  const { data, error } = await supabase
    .from("watched_packages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as WatchedPackageRow[];
}

export async function listAllWatchedPackages(
  supabase: SupabaseClient
): Promise<WatchedPackageRow[]> {
  const { data, error } = await supabase
    .from("watched_packages")
    .select("*")
    .not("user_id", "is", null);

  if (error) throw error;
  return (data ?? []) as WatchedPackageRow[];
}

export async function saveWatchedPackage(
  supabase: SupabaseClient,
  report: SafetyReport,
  userId: string
): Promise<WatchedPackageRow> {
  const legacyStatus: "pass" | "fail" | "warn" =
    report.verdict === "green"
      ? "pass"
      : report.verdict === "yellow"
        ? "warn"
        : "fail";

  const { data, error } = await supabase
    .from("watched_packages")
    .upsert(
      {
        user_id: userId,
        name: report.name,
        version: report.version,
        published_at: report.signals.release_age.publishedAt ?? report.checkedAt,
        status: legacyStatus,
        verdict: report.verdict,
        blocked: report.blocked,
        signals_json: report.signals,
        last_checked_at: report.checkedAt,
      },
      { onConflict: "user_id,name" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as WatchedPackageRow;
}

export async function updateWatchedPackageReport(
  supabase: SupabaseClient,
  id: string,
  report: SafetyReport
): Promise<void> {
  const legacyStatus: "pass" | "fail" | "warn" =
    report.verdict === "green"
      ? "pass"
      : report.verdict === "yellow"
        ? "warn"
        : "fail";

  const { error } = await supabase
    .from("watched_packages")
    .update({
      version: report.version,
      published_at: report.signals.release_age.publishedAt ?? report.checkedAt,
      status: legacyStatus,
      verdict: report.verdict,
      blocked: report.blocked,
      signals_json: report.signals,
      last_checked_at: report.checkedAt,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteWatchedPackage(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("watched_packages").delete().eq("id", id);
  if (error) throw error;
}
