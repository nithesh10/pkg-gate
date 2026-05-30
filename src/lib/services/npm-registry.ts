/** Backward-compatible re-exports — prefer safety-orchestrator for new code. */
export {
  fetchLatestPackage,
  isPackageAgeOk,
  NpmRegistryError,
} from "./providers/npm-registry";

export type { PackageCheckResult } from "./legacy-types";
