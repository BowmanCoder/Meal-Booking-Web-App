import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { AvailabilityDay } from "../../api/types";
import { eachDay } from "../../lib/dates";
import { renderApp } from "../../test/render";
import MonthCalendar from "./MonthCalendar";

const DAYS = eachDay("2030-01-07", "2030-01-13"); // Monday to Sunday

function day(date: string, overrides: Partial<AvailabilityDay> = {}): [string, AvailabilityDay] {
  return [
    date,
    { date, cutoff: `${date}T09:30:00Z`, is_served: true, is_open: true, booking: null, is_redeemed: false, ...overrides },
  ];
}

describe("MonthCalendar", () => {
  it("lets open days be picked and blocks the rest", async () => {
    const availability = new Map([
      day("2030-01-07"),
      day("2030-01-08", { booking: 5 }),
      day("2030-01-09", { is_open: false }),
    ]);
    const onPick = vi.fn();
    renderApp(
      <MonthCalendar
        days={DAYS}
        month="2030-01-01"
        availability={availability}
        selected={new Set(["2030-01-07"])}
        rangeAnchor={null}
        canSelect={(date) => {
          const info = availability.get(date);
          return Boolean(info && info.is_open && info.booking === null);
        }}
        onPick={onPick}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(7);
    const [monday, tuesday, wednesday] = buttons;

    expect(monday).toBeEnabled();
    expect(monday).toHaveAttribute("aria-pressed", "true");
    expect(tuesday).toBeDisabled();
    expect(tuesday).toHaveAccessibleName(/already booked/);
    expect(wednesday).toBeDisabled();
    expect(wednesday).toHaveAccessibleName(/not available/);

    await userEvent.click(monday);
    expect(onPick).toHaveBeenCalledWith("2030-01-07");
  });
});
