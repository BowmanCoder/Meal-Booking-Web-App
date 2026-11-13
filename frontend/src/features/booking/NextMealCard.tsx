import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { QRCodeSVG } from "qrcode.react";

import { useGetMyBookingsQuery } from "../../api/bookingApi";
import { formatDate, todayISO } from "../../lib/dates";
import { primaryTint } from "../../theme";

/** The signed-in user's next uncollected meal, with its coupon. */
export default function NextMealCard() {
  const { data: bookings } = useGetMyBookingsQuery({ date_from: todayISO() });
  const next = bookings?.find((booking) => !booking.is_redeemed);
  if (!next) return null;

  return (
    <Stack
      component="section"
      aria-label="Your next meal"
      direction={{ xs: "column", sm: "row" }}
      spacing={3}
      sx={{ alignItems: { sm: "center" }, p: 3, borderRadius: 6, bgcolor: primaryTint }}
    >
      {/* A QR code stays black on white in both colour schemes so scanners can read it. */}
      <Box sx={{ p: 1.5, bgcolor: "#FFFFFF", borderRadius: 3, lineHeight: 0, alignSelf: "flex-start" }}>
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
