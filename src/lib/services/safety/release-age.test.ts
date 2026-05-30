import { describe, expect, it, vi, afterEach } from "vitest";
import { ageDaysSince, isPackageAgeOk } from "./release-age";

describe("isPackageAgeOk", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("passes when package is older than minDays", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T12:00:00.000Z"));

    expect(isPackageAgeOk("2026-05-20T12:00:00.000Z", 7)).toBe(true);
    expect(isPackageAgeOk("2026-05-23T12:00:00.000Z", 7)).toBe(true);
  });

  it("fails when package is newer than minDays", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T12:00:00.000Z"));

    expect(isPackageAgeOk("2026-05-30T12:00:00.000Z", 7)).toBe(false);
    expect(isPackageAgeOk("2026-05-31T11:00:00.000Z", 7)).toBe(false);
  });

  it("uses custom minDays threshold", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T12:00:00.000Z"));

    expect(isPackageAgeOk("2026-05-29T12:00:00.000Z", 1)).toBe(true);
    expect(isPackageAgeOk("2026-05-30T18:00:00.000Z", 1)).toBe(false);
  });
});

describe("ageDaysSince", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes fractional days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T12:00:00.000Z"));
    expect(ageDaysSince("2026-05-28T12:00:00.000Z")).toBe(3);
  });
});
