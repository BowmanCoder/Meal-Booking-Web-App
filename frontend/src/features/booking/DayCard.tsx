import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { AvailabilityDay } from "../../api/types";
import { formatDate, formatDateTime } from "../../lib/dates";

interface Props {
  date: string;
  mealName: string;
  menu: string | undefined;
  day: AvailabilityDay | undefined;
  /** The booking status could not be loaded from the server. */
  failed: boolean;
  isToday: boolean;
  busy: boolean;
  onBook: () => void;
  onCancel: (bookingId: number) => void;
}

/** One day of the week view: what is served, and the booking action for it. */
export default function DayCard({ date, mealName, menu, day, failed, isToday, busy, onBook, onCancel }: Props) {
  return (
    <Card
      component="article"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: 2.5,
        border: 2,
        borderColor: isToday ? "primary.main" : "transparent",
      }}
    >
      <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="h3" component="h2">
          {formatDate(date, { weekday: "short", day: "numeric", month: "short" })}
        </Typography>
        {isToday && <Chip size="small" color="primary" label="Today" />}
      </Stack>

      <Typography color={menu ? "text.primary" : "text.secondary"} sx={{ flex: 1, minHeight: 48 }}>
        {menu ?? "Menu not published yet."}
      </Typography>

      <Box>
        {!day ? (
          <Typography variant="body2" color="text.secondary">
            {failed ? "Booking unavailable" : "Loading…"}
          </Typography>
        ) : day.booking !== null && day.is_redeemed ? (
          <Typography sx={{ fontWeight: 700, color: "success.main" }}>Collected</Typography>
        ) : day.booking !== null ? (
          <Stack spacing={0.5}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography sx={{ fontWeight: 700, color: "primary.main" }}>Booked</Typography>
              {day.is_open && (
                <Button
                  size="small"
                  color="inherit"
                  disabled={busy}
                  onClick={() => onCancel(day.booking as number)}
                  aria-label={`Cancel ${mealName} on ${formatDate(date, { weekday: "long", day: "numeric", month: "long" })}`}
                >
                  Cancel
                </Button>
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {day.is_open ? `Cancel until ${formatDateTime(day.cutoff)}` : "Too late to cancel"}
            </Typography>
          </Stack>
        ) : day.is_open ? (
          <Stack spacing={0.5}>
            <Button
              fullWidth
              variant="contained"
              disabled={busy}
              onClick={onBook}
              aria-label={`Book ${mealName} on ${formatDate(date, { weekday: "long", day: "numeric", month: "long" })}`}
            >
              Book {mealName.toLowerCase()}
            </Button>
            <Typography variant="body2" color="text.secondary">
              Closes {formatDateTime(day.cutoff)}
            </Typography>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Booking closed
          </Typography>
        )}
      </Box>
    </Card>
  );
}
