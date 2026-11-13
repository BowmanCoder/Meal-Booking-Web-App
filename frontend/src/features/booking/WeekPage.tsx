import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import {
  useCancelBookingMutation,
  useCreateBookingsMutation,
  useGetAvailabilityQuery,
  useGetMealsQuery,
  useGetMenusQuery,
} from "../../api/bookingApi";
import { errorMessage } from "../../api/errors";
import { addDays, eachDay, formatDate, startOfWeek, todayISO } from "../../lib/dates";
import BulkBookDialog from "./BulkBookDialog";
import DayCard from "./DayCard";
import NextMealCard from "./NextMealCard";

interface Notice {
  severity: "success" | "error";
  text: string;
}

/** The home screen: this week's menu for one meal, bookable day by day. */
export default function WeekPage() {
  const today = todayISO();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [chosenMeal, setChosenMeal] = useState<number | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const { data: meals, isLoading: mealsLoading, error: mealsError } = useGetMealsQuery();
  // Default to lunch when there is one, otherwise the first meal of the day.
  const meal = useMemo(() => {
    if (!meals || meals.length === 0) return undefined;
    return (
      meals.find((candidate) => candidate.id === chosenMeal) ??
      meals.find((candidate) => candidate.name.toLowerCase() === "lunch") ??
      meals[0]
    );
  }, [meals, chosenMeal]);

  const weekEnd = addDays(weekStart, 6);
  const range = { meal: meal?.id ?? 0, date_from: weekStart, date_to: weekEnd };
  const { data: menus } = useGetMenusQuery(range, { skip: !meal });
  const { data: availability, error: availabilityError } = useGetAvailabilityQuery(range, { skip: !meal });
  const [createBookings, { isLoading: booking }] = useCreateBookingsMutation();
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation();
  const busy = booking || cancelling;

  const menuByDate = useMemo(() => new Map((menus ?? []).map((menu) => [menu.date, menu.description])), [menus]);
  const dayByDate = useMemo(
    () => new Map((availability?.days ?? []).map((day) => [day.date, day])),
    [availability],
  );

  async function handleBook(date: string) {
    if (!meal) return;
    try {
      await createBookings({ meal: meal.id, date }).unwrap();
      setNotice({
        severity: "success",
        text: `${meal.name} booked for ${formatDate(date, { weekday: "long", day: "numeric", month: "long" })}.`,
      });
    } catch (error) {
      setNotice({ severity: "error", text: errorMessage(error) });
    }
  }

  async function handleCancel(bookingId: number) {
    try {
      await cancelBooking(bookingId).unwrap();
      setNotice({ severity: "success", text: "Booking cancelled." });
    } catch (error) {
      setNotice({ severity: "error", text: errorMessage(error) });
    }
  }

  if (mealsError) {
    return <Alert severity="error">{errorMessage(mealsError, "The menu could not be loaded.")}</Alert>;
  }
  if (mealsLoading) {
    return <Typography color="text.secondary">Loading the menu…</Typography>;
  }
  if (!meal || !meals) {
    return (
      <Alert severity="info">
        No meals have been set up yet. An admin needs to add them before anything can be booked.
      </Alert>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ alignItems: { md: "flex-end" }, justifyContent: "space-between" }}
      >
        <Stack spacing={1}>
          <Typography variant="h1">{weekStart === startOfWeek(today) ? "This week's menu" : "Menu"}</Typography>
          <Typography color="text.secondary">
            {formatDate(weekStart, { day: "numeric", month: "long" })} to{" "}
            {formatDate(weekEnd, { day: "numeric", month: "long", year: "numeric" })}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} role="group" aria-label="Meal" sx={{ flexWrap: "wrap", rowGap: 1 }}>
          {meals.map((option) => (
            <Button
              key={option.id}
              variant={option.id === meal.id ? "contained" : "outlined"}
              aria-pressed={option.id === meal.id}
              onClick={() => setChosenMeal(option.id)}
            >
              {option.name}
            </Button>
          ))}
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1, justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1}>
          <Button
            color="inherit"
            disabled={weekStart <= startOfWeek(today)}
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            Previous week
          </Button>
          <Button color="inherit" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Next week
          </Button>
        </Stack>
        <Button variant="outlined" onClick={() => setBulkOpen(true)}>
          Book several days
        </Button>
      </Stack>

      {availabilityError && (
        <Alert severity="error">
          {errorMessage(availabilityError, "Bookings could not be loaded. Please refresh the page.")}
        </Alert>
      )}

      <Box
        component="section"
        aria-label={`${meal.name} by day`}
        sx={{ display: "grid", gap: 2.5, gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}
      >
        {eachDay(weekStart, weekEnd).map((date) => (
          <DayCard
            key={date}
            date={date}
            mealName={meal.name}
            menu={menuByDate.get(date)}
            day={dayByDate.get(date)}
            failed={Boolean(availabilityError)}
            isToday={date === today}
            busy={busy}
            onBook={() => handleBook(date)}
            onCancel={handleCancel}
          />
        ))}
      </Box>

      <NextMealCard />

      {bulkOpen && (
        <BulkBookDialog
          meal={meal}
          onClose={() => setBulkOpen(false)}
          onBooked={(count) => {
            setBulkOpen(false);
            setNotice({
              severity: "success",
              text: `${meal.name} booked on ${count} ${count === 1 ? "day" : "days"}.`,
            });
          }}
        />
      )}

      <Snackbar
        open={notice !== null}
        autoHideDuration={6000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={notice?.severity ?? "success"} variant="filled" onClose={() => setNotice(null)}>
          {notice?.text}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
