import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { AvailabilityDay } from "../../api/types";
import { renderApp } from "../../test/render";
import DayCard from "./DayCard";

const OPEN: AvailabilityDay = {
  date: "2030-01-11",
  cutoff: "2030-01-11T09:30:00Z",
  is_served: true,
  is_open: true,
  booking: null,
  is_redeemed: false,
};

function renderCard(day: AvailabilityDay | undefined, extra: { failed?: boolean } = {}) {
  const onBook = vi.fn();
  const onCancel = vi.fn();
  renderApp(
    <DayCard
      date="2030-01-11"
      mealName="Lunch"
      menu="Dal tadka, jeera rice"
      photo={null}
      reservePhotoSpace={false}
      day={day}
      failed={extra.failed ?? false}
      isToday={false}
      busy={false}
      onBook={onBook}
      onCancel={onCancel}
    />,
  );
  return { onBook, onCancel };
}

describe("DayCard", () => {
  it("offers booking on an open day", async () => {
    const { onBook } = renderCard(OPEN);
    expect(screen.getByText("Dal tadka, jeera rice")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^Book Lunch on/ }));
    expect(onBook).toHaveBeenCalledOnce();
  });

  it("offers cancelling a booked day while it is still open", async () => {
    const { onCancel } = renderCard({ ...OPEN, booking: 42 });
    expect(screen.getByText("Booked")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^Cancel Lunch on/ }));
    expect(onCancel).toHaveBeenCalledWith(42);
  });

  it("has no cancel button once cancelling has closed", () => {
    renderCard({ ...OPEN, booking: 42, is_open: false });
    expect(screen.getByText("Too late to cancel")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows a collected meal", () => {
    renderCard({ ...OPEN, booking: 42, is_open: false, is_redeemed: true });
    expect(screen.getByText("Collected")).toBeInTheDocument();
  });

  it("explains days that cannot be booked", () => {
    renderCard({ ...OPEN, is_open: false });
    expect(screen.getByText("Booking closed")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("marks days the meal is not served", () => {
    renderCard({ ...OPEN, is_served: false, is_open: false });
    expect(screen.getByText("Not served")).toBeInTheDocument();
  });

  it("says so when the booking status failed to load", () => {
    renderCard(undefined, { failed: true });
    expect(screen.getByText("Booking unavailable")).toBeInTheDocument();
  });
});
