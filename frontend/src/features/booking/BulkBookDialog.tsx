import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import { useCreateBookingsMutation, useGetAvailabilityQuery } from "../../api/bookingApi";
import { errorMessage } from "../../api/errors";
import type { AvailabilityDay, Meal } from "../../api/types";
import {
  addDays,
  addMonths,
  eachDay,
  formatDate,
  isWeekend,
  startOfMonth,
  startOfWeek,
  todayISO,
} from "../../lib/dates";
import MonthCalendar from "./MonthCalendar";

const MAX_DAYS = 31;
type PickMode = "days" | "range";

interface Props {
  meal: Meal;
  onClose: () => void;
  onBooked: (count: number) => void;
}

/** Pick several days on a calendar and book one meal on all of them at once. */
export default function BulkBookDialog({ meal, onClose, onBooked }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(todayISO()));
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [weekdaysOnly, setWeekdaysOnly] = useState(true);
  const [pickMode, setPickMode] = useState<PickMode>("days");
  const [rangeAnchor, setRangeAnchor] = useState<string | null>(null);
  const [createBookings, { isLoading, error }] = useCreateBookingsMutation();

  // Six full weeks, Monday to Sunday, covering the month.
  const days = useMemo(() => {
    const first = startOfWeek(month);
    return eachDay(first, addDays(first, 41));
  }, [month]);

  const { data, isFetching, error: availabilityError } = useGetAvailabilityQuery({
    meal: meal.id,
    date_from: days[0],
    date_to: days[days.length - 1],
  });
  const availability = useMemo(
    () => new Map<string, AvailabilityDay>((data?.days ?? []).map((day) => [day.date, day])),
    [data],
  );

  function canSelect(date: string): boolean {
    const info = availability.get(date);
    if (!info || !info.is_open || info.booking !== null) return false;
    return !(weekdaysOnly && isWeekend(date));
  }

  function handlePick(date: string) {
    const next = new Set(selected);
    if (pickMode === "days") {
      if (next.has(date)) next.delete(date);
      else next.add(date);
    } else if (rangeAnchor === null) {
      setRangeAnchor(date);
      next.add(date);
    } else {
      const [from, to] = rangeAnchor <= date ? [rangeAnchor, date] : [date, rangeAnchor];
      eachDay(from, to)
        .filter(canSelect)
        .forEach((day) => next.add(day));
      setRangeAnchor(null);
    }
    setSelected(next);
  }

  function handleWeekdaysOnly(checked: boolean) {
    setWeekdaysOnly(checked);
    if (checked) setSelected(new Set([...selected].filter((date) => !isWeekend(date))));
  }

  async function handleConfirm() {
    try {
      const dates = [...selected].sort();
      await createBookings({ meal: meal.id, dates }).unwrap();
      onBooked(dates.length);
    } catch {
      // The error is shown from the mutation state below.
    }
  }

  const count = selected.size;
  const tooMany = count > MAX_DAYS;
  const thisMonth = startOfMonth(todayISO());

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="bulk-book-title">
      <DialogTitle id="bulk-book-title">Book {meal.name.toLowerCase()} on several days</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {error && <Alert severity="error">{errorMessage(error)}</Alert>}
          {availabilityError && (
            <Alert severity="error">
              {errorMessage(availabilityError, "Open days could not be loaded. Close this and try again.")}
            </Alert>
          )}

          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            aria-label="How to pick days"
            value={pickMode}
            onChange={(_event, value: PickMode | null) => {
              if (value) {
                setPickMode(value);
                setRangeAnchor(null);
              }
            }}
          >
            <ToggleButton value="days">Pick days</ToggleButton>
            <ToggleButton value="range">Pick a range</ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="body2" color="text.secondary">
            {pickMode === "days"
              ? "Tap each day you want."
              : rangeAnchor
                ? "Now tap the last day."
                : "Tap the first day, then the last day."}
          </Typography>

          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Button size="small" disabled={month <= thisMonth} onClick={() => setMonth(addMonths(month, -1))}>
              Previous
            </Button>
            <Typography sx={{ fontWeight: 700 }} aria-live="polite">
              {formatDate(month, { month: "long", year: "numeric" })}
            </Typography>
            <Button size="small" onClick={() => setMonth(addMonths(month, 1))}>
              Next
            </Button>
          </Stack>

          <MonthCalendar
            days={days}
            month={month}
            availability={availability}
            selected={selected}
            rangeAnchor={rangeAnchor}
            canSelect={canSelect}
            onPick={handlePick}
          />
          {isFetching && (
            <Typography variant="body2" color="text.secondary">
              Checking which days are open…
            </Typography>
          )}

          <FormControlLabel
            sx={{ justifyContent: "space-between", ml: 0 }}
            labelPlacement="start"
            label="Weekdays only"
            control={
              <Switch checked={weekdaysOnly} onChange={(event) => handleWeekdaysOnly(event.target.checked)} />
            }
          />

          <Typography aria-live="polite" color={tooMany ? "error" : "text.primary"} sx={{ fontWeight: 600 }}>
            {count === 0
              ? "No days selected yet."
              : tooMany
                ? `You can book at most ${MAX_DAYS} days at once. ${count} selected.`
                : `${meal.name} on ${count} ${count === 1 ? "day" : "days"}.`}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={onClose}>
          Close
        </Button>
        <Button variant="contained" disabled={count === 0 || tooMany || isLoading} onClick={handleConfirm}>
          {isLoading ? "Booking…" : count > 0 ? `Book ${count} ${count === 1 ? "day" : "days"}` : "Book"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
