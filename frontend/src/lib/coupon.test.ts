import { describe, expect, it } from "vitest";

import { shortCode } from "./coupon";

describe("shortCode", () => {
  it("shows the first eight characters, upper case, in two groups", () => {
    expect(shortCode("3f2b8c1e-9a4d-4c2b-8f1e-0123456789ab")).toBe("3F2B 8C1E");
  });
});
