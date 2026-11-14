import { describe, expect, it } from "vitest";

import { addDays, addMonths, eachDay, parseISODate, startOfMonth, startOfWeek, toISODate } from "./dates";

describe("dates", () => {
  it("round-trips an ISO date through a Date without shifting the day", () => {
    for (const iso of ["2026-01-01", "2026-03-08", "2026-11-01", "2026-12-31"]) {
      expect(toISODate(parseISODate(iso))).toBe(iso);
    }
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29"); // leap year
  });

  it("is not thrown off by daylight saving changes", () => {
    // Clocks change on these nights in several time zones.
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09");
    expect(addDays("2026-10-31", 2)).toBe("2026-11-02");
    expect(eachDay("2026-03-06", "2026-03-10")).toHaveLength(5);
  });

  it("finds the Monday of a week, including for a Sunday", () => {
    expect(startOfWeek("2026-11-12")).toBe("2026-11-09"); // Thursday
    expect(startOfWeek("2026-11-09")).toBe("2026-11-09"); // Monday
    expect(startOfWeek("2026-11-15")).toBe("2026-11-09"); // Sunday
  });

  it("lists every day in a range, inclusive", () => {
    expect(eachDay("2026-02-27", "2026-03-02")).toEqual([
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
    expect(eachDay("2026-05-05", "2026-05-05")).toEqual(["2026-05-05"]);
  });

  it("moves between months from the first of the month", () => {
    expect(startOfMonth("2026-11-23")).toBe("2026-11-01");
    expect(addMonths("2026-12-01", 1)).toBe("2027-01-01");
    expect(addMonths("2026-01-31", -1)).toBe("2025-12-01");
  });
});
