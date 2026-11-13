import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import type { AvailabilityDay } from "../../api/types";
import { formatDate, parseISODate } from "../../lib/dates";
import { primaryTint } from "../../theme";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  /** Every day shown, in order, starting on a Monday. */
  days: string[];
  /** First day of the month being shown; other days are dimmed. */
  month: string;
  availability: Map<string, AvailabilityDay>;
  selected: ReadonlySet<string>;
  rangeAnchor: string | null;
  canSelect: (date: string) => boolean;
  onPick: (date: string) => void;
}

/** A month grid where each selectable day is a toggle button. */
export default function MonthCalendar({ days, month, availability, selected, rangeAnchor, canSelect, onPick }: Props) {
  const monthIndex = parseISODate(month).getMonth();

  return (
    <Box role="group" aria-label={formatDate(month, { month: "long", year: "numeric" })}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, mb: 0.5 }}>
        {WEEKDAYS.map((weekday) => (
          <Typography key={weekday} variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
            {weekday}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
        {days.map((date) => {
          const info = availability.get(date);
          const booked = info !== undefined && info.booking !== null;
          const selectable = canSelect(date);
          const isSelected = selected.has(date);
          const isAnchor = rangeAnchor === date;
          const outsideMonth = parseISODate(date).getMonth() !== monthIndex;
          const label = formatDate(date, { weekday: "long", day: "numeric", month: "long" });
          const status = booked ? "already booked" : selectable ? "" : "not available";

          return (
            <ButtonBase
              key={date}
              disabled={!selectable}
              aria-pressed={isSelected}
              aria-label={status ? `${label}, ${status}` : label}
              onClick={() => onPick(date)}
              sx={{
                minHeight: 44,
                borderRadius: "10px",
                flexDirection: "column",
                fontSize: 15,
                fontWeight: isSelected || booked ? 700 : 400,
                opacity: outsideMonth ? 0.55 : 1,
                border: 2,
                borderColor: isAnchor ? "primary.main" : "transparent",
                color: isSelected ? "primary.contrastText" : booked ? "primary.main" : "text.primary",
                bgcolor: isSelected ? "primary.main" : booked ? primaryTint : "transparent",
                "&.Mui-disabled": {
                  color: booked ? "primary.main" : "text.disabled",
                },
                "&:hover": { bgcolor: isSelected ? "primary.dark" : "action.hover" },
                "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
              }}
            >
              {parseISODate(date).getDate()}
              {booked && (
                <Box component="span" sx={{ fontSize: 10, lineHeight: 1, fontWeight: 600 }}>
                  Booked
                </Box>
              )}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
