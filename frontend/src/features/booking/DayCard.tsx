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
  photo: string | null | undefined;
  /** Keep a photo-sized space even without a photo, so a row of cards lines up. */
  reservePhotoSpace: boolean;
  day: AvailabilityDay | undefined;
  /** The booking status could not be loaded from the server. */
  failed: boolean;
  isToday: boolean;
  busy: boolean;
  onBook: () => void;
  onCancel: (bookingId: number) => void;
}

const PHOTO_HEIGHT = 132;

/** One day of the week view: what is served, and the booking action for it. */
export default function DayCard({
  date,
  mealName,
  menu,
  photo,
  reservePhotoSpace,
  day,
  failed,
  isToday,
  busy,
  onBook,
  onCancel,
}: Props) {
  const longDate = formatDate(date, { weekday: "long", day: "numeric", month: "long" });

  return (
    <Card
      component="article"
      sx={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: 2,
        borderColor: isToday ? "primary.main" : "transparent",
      }}
    >
      {photo ? (
        // The dish is described in text below, so the photo is decorative.
        <Box
          component="img"
          src={photo}
          alt=""
          loading="lazy"
          sx={{ width: "100%", height: PHOTO_HEIGHT, objectFit: "cover", display: "block" }}
        />
      ) : (
        reservePhotoSpace && <Box aria-hidden sx={{ height: PHOTO_HEIGHT, bgcolor: "action.hover" }} />
      )}

      <Stack spacing={2} sx={{ flex: 1, p: 2.5 }}>
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
          ) : !day.is_served && day.booking === null ? (
            <Typography variant="body2" color="text.secondary">
              Not served
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
                    aria-label={`Cancel ${mealName} on ${longDate}`}
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
                aria-label={`Book ${mealName} on ${longDate}`}
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
      </Stack>
    </Card>
  );
}
