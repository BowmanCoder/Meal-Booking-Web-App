import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { errorMessage } from "../../api/errors";
import { useGetAttendanceQuery, useGetForecastQuery, useGetPrepSheetQuery } from "../../api/kitchenApi";
import { DIETARY_LABELS, type DietaryPreference, type ForecastRow, type PrepMeal } from "../../api/types";
import { formatDate, todayISO } from "../../lib/dates";

const FORECAST_DAYS = 7;
const DIETS = Object.keys(DIETARY_LABELS) as DietaryPreference[];

function percent(rate: number | null): string {
  return rate === null ? "n/a" : `${Math.round(rate * 100)}%`;
}

function PrepCard({ meal, expected }: { meal: PrepMeal; expected: ForecastRow | undefined }) {
  return (
    <Card component="article" sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="h3" component="h2">
          {meal.meal_name}{" "}
          <Typography component="span" variant="body2" color="text.secondary">
            {meal.serve_time.slice(0, 5)}
          </Typography>
        </Typography>
        <Chip
          size="small"
          color={meal.is_served && !meal.is_final ? "primary" : "default"}
          label={!meal.is_served ? "Not served" : meal.is_final ? "Final" : "Still open"}
        />
      </Stack>

      <Stack direction="row" sx={{ alignItems: "baseline", gap: 1.5 }}>
        <Typography sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 56, lineHeight: 1 }}>
          {meal.total}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {meal.is_final
            ? "to prepare"
            : expected && expected.forecast !== null
              ? `booked so far, ${expected.forecast} expected`
              : "booked so far"}
        </Typography>
      </Stack>

      <Typography color={meal.menu ? "text.primary" : "text.secondary"}>
        {meal.menu || "No menu published."}
      </Typography>

      <Divider />
      <Stack spacing={0.75}>
        {DIETS.map((diet) => (
          <Stack key={diet} direction="row" sx={{ justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">
              {DIETARY_LABELS[diet]}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {meal.by_dietary_preference[diet] ?? 0}
            </Typography>
          </Stack>
        ))}
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            Of which guests
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {meal.guests}
          </Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            Collected
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {meal.redeemed}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}

/** What the kitchen needs to plan: counts for a day, no-show rates and a forecast. */
export default function KitchenPage() {
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [forecastMeal, setForecastMeal] = useState<number | null>(null);

  const prep = useGetPrepSheetQuery(date);
  const attendance = useGetAttendanceQuery();
  const forecast = useGetForecastQuery(FORECAST_DAYS);

  const forecastRows = forecast.data?.days ?? [];
  const forecastMeals = [...new Map(forecastRows.map((row) => [row.meal, row.meal_name])).entries()];
  const shownMeal = forecastMeal ?? forecastMeals.find(([, name]) => name.toLowerCase() === "lunch")?.[0] ?? forecastMeals[0]?.[0];
  const highestRate = Math.max(0.01, ...(attendance.data?.by_meal ?? []).map((meal) => meal.no_show_rate ?? 0));
  const loadError = prep.error ?? attendance.error ?? forecast.error;

  return (
    <Stack spacing={4}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ alignItems: { md: "flex-end" }, justifyContent: "space-between" }}
      >
        <Stack spacing={1}>
          <Typography variant="h1">{date === today ? "Today's kitchen" : "Kitchen"}</Typography>
          <Typography color="text.secondary">
            {formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}. Counts are final
            once booking closes.
          </Typography>
        </Stack>
        <TextField
          label="Day"
          type="date"
          size="small"
          fullWidth={false}
          value={date}
          onChange={(event) => setDate(event.target.value || today)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      {loadError && <Alert severity="error">{errorMessage(loadError, "The kitchen numbers could not be loaded.")}</Alert>}

      <Box
        component="section"
        aria-label="Prep sheet"
        sx={{ display: "grid", gap: 2.5, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >
        {prep.isLoading && <Typography color="text.secondary">Loading the prep sheet…</Typography>}
        {(prep.data?.meals ?? []).map((meal) => (
          <PrepCard
            key={meal.meal}
            meal={meal}
            expected={forecastRows.find((row) => row.date === date && row.meal === meal.meal)}
          />
        ))}
      </Box>

      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", alignItems: "start" }}>
        <Card component="section" aria-labelledby="no-show-heading" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h2" id="no-show-heading">
                No-shows, last 4 weeks
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Booked meals that were never collected.
              </Typography>
            </Box>
            {(attendance.data?.by_meal ?? []).map((meal) => (
              <Stack key={meal.meal} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Typography variant="body2" sx={{ width: 84, flex: "none" }}>
                  {meal.meal_name}
                </Typography>
                <Box aria-hidden sx={{ flex: 1, height: 16, borderRadius: 999, bgcolor: "action.hover" }}>
                  <Box
                    sx={{
                      width: `${((meal.no_show_rate ?? 0) / highestRate) * 100}%`,
                      height: "100%",
                      borderRadius: 999,
                      bgcolor: "primary.main",
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ width: 44, flex: "none", textAlign: "right", fontWeight: 700 }}>
                  {percent(meal.no_show_rate)}
                </Typography>
              </Stack>
            ))}
            {attendance.data && (
              <Typography variant="body2">
                {attendance.data.overall.booked === 0 ? (
                  "No bookings in this period yet."
                ) : (
                  <>
                    <strong>{percent(attendance.data.overall.no_show_rate)} overall.</strong>{" "}
                    {attendance.data.overall.no_shows} of {attendance.data.overall.booked} booked meals.
                  </>
                )}
              </Typography>
            )}
          </Stack>
        </Card>

        <Card component="section" aria-labelledby="forecast-heading" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h2" id="forecast-heading">
                Coming days
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expected is the average for the same weekday over the last four weeks.
              </Typography>
            </Box>
            <Stack direction="row" role="group" aria-label="Meal" sx={{ flexWrap: "wrap", gap: 1 }}>
              {forecastMeals.map(([id, name]) => (
                <Button
                  key={id}
                  size="small"
                  variant={id === shownMeal ? "contained" : "outlined"}
                  aria-pressed={id === shownMeal}
                  onClick={() => setForecastMeal(id)}
                >
                  {name}
                </Button>
              ))}
            </Stack>
            <TableContainer>
              <Table size="small" aria-labelledby="forecast-heading">
                <TableHead>
                  <TableRow>
                    <TableCell>Day</TableCell>
                    <TableCell align="right">Booked so far</TableCell>
                    <TableCell align="right">Expected</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {forecastRows
                    .filter((row) => row.meal === shownMeal)
                    .map((row) => (
                      <TableRow key={row.date}>
                        <TableCell component="th" scope="row">
                          {formatDate(row.date, { weekday: "short", day: "numeric", month: "short" })}
                        </TableCell>
                        <TableCell align="right">{row.booked}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {row.is_final ? `${row.booked} (final)` : (row.forecast ?? "No history yet")}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </Card>
      </Box>
    </Stack>
  );
}
