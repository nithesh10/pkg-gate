const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Pure age gate — true when publish date is at least minDays old. */
export function isPackageAgeOk(
  publishedAt: Date | string,
  minDays = 7
): boolean {
  const published =
    typeof publishedAt === "string" ? new Date(publishedAt) : publishedAt;
  const ageMs = Date.now() - published.getTime();
  return ageMs / MS_PER_DAY >= minDays;
}

export function ageDaysSince(publishedAt: Date | string): number {
  const published =
    typeof publishedAt === "string" ? new Date(publishedAt) : publishedAt;
  return (
    Math.round(((Date.now() - published.getTime()) / MS_PER_DAY) * 10) / 10
  );
}
