/** @deprecated Use SafetyReport from safety/types */
export type PackageCheckResult = {
  name: string;
  version: string;
  publishedAt: string;
  status: "pass" | "fail";
  ageDays: number;
  minDays: number;
};
