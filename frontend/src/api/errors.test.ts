import { describe, expect, it } from "vitest";

import { errorMessage } from "./errors";

describe("errorMessage", () => {
  it("reads the shapes the API uses", () => {
    expect(errorMessage({ status: 400, data: { detail: "Not allowed." } })).toBe("Not allowed.");
    expect(errorMessage({ status: 400, data: ["Booking has closed."] })).toBe("Booking has closed.");
    expect(errorMessage({ status: 400, data: { errors: { password: ["Too short.", "Too common."] } } })).toBe(
      "Too short. Too common.",
    );
    expect(errorMessage({ status: 400, data: { non_field_errors: ["Pick a date."] } })).toBe("Pick a date.");
  });

  it("explains a network failure", () => {
    expect(errorMessage({ status: "FETCH_ERROR", error: "TypeError: Failed to fetch" })).toMatch(/reach the server/);
  });

  it("falls back when there is nothing to read", () => {
    expect(errorMessage(undefined)).toMatch(/went wrong/);
    expect(errorMessage(new Error("boom"))).toMatch(/went wrong/);
    expect(errorMessage({ status: 500, data: {} }, "Custom fallback.")).toBe("Custom fallback.");
  });
});
