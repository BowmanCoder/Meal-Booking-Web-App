import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { QRCodeSVG } from "qrcode.react";

import { useGetMealsQuery, useGetMyBookingsQuery } from "../../api/bookingApi";
import type { Booking, Meal } from "../../api/types";
import { formatDate, todayISO } from "../../lib/dates";
import { primaryTint } from "../../theme";

// A meal stays "next" until this long after it starts being served.
const SERVING_WINDOW_HOURS = 2;

/** True when today's serving of this meal is over, so its coupon is no longer useful. */
function servingIsOver(booking: Booking, meals: Meal[] | undefined, today: string): boolean {
  if (booking.date !== today) return false;
  const meal = meals?.find((candidate) => candidate.id === booking.meal);
  if (!meal) return false;
  const [hours, minutes] = meal.serve_time.split(":").map(Number);
  const end = new Date();
  end.setHours(hours + SERVING_WINDOW_HOURS, minutes, 0, 0);
  return new Date() > end;
}

/** The signed-in user's next uncollected meal, with its coupon. */
export default function NextMealCard() {
  const today = todayISO();
  const { data: bookings, isSuccess } = useGetMyBookingsQuery({ date_from: today });
  const { data: meals } = useGetMealsQuery();
  const next = bookings?.find(
    (booking) => !booking.is_redeemed && !servingIsOver(booking, meals, today),
  );
  if (!next) {
    // Say so, rather than leaving a gap, once we know there is nothing booked.
    return isSuccess ? (
      <Typography color="text.secondary" sx={{ p: 3, borderRadius: "24px", bgcolor: primaryTint }}>
        You have no meals booked yet. Pick a day above to get started.
      </Typography>
    ) : null;
  }

  return (
    <Stack
      component="section"
      aria-label="Your next meal"
      direction={{ xs: "column", sm: "row" }}
      spacing={3}
      sx={{ alignItems: { sm: "center" }, p: 3, borderRadius: "24px", bgcolor: primaryTint }}
    >
      {/* A QR code stays black on white in both colour schemes so scanners can read it. */}
      <Box sx={{ p: 1.5, bgcolor: "#FFFFFF", borderRadius: "12px", lineHeight: 0, alignSelf: "flex-start" }}>
        <QRCodeSVG
          value={next.coupon_code}
          size={112}
          title={`Coupon for ${next.meal_name} on ${formatDate(next.date, { weekday: "long", day: "numeric", month: "long" })}`}
        />
      </Box>
      <Stack spacing={0.5}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
          Your next meal
        </Typography>
        <Typography variant="h2">
          {next.meal_name}, {formatDate(next.date, { weekday: "long", day: "numeric", month: "long" })}
        </Typography>
        <Typography color="text.secondary">
          {next.is_guest ? `Guest: ${next.guest_name}. ` : ""}
          Show this code at the counter. It works once, on the day of the meal.
        </Typography>
      </Stack>
    </Stack>
  );
}
