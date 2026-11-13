import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { useGetMealsQuery, useGetMenusQuery } from "../../api/bookingApi";
import { errorMessage } from "../../api/errors";
import type { Meal, Menu } from "../../api/types";
import { addDays, eachDay, formatDate, parseISODate, startOfWeek, todayISO } from "../../lib/dates";
import MealDialog from "./MealDialog";
import MenuDialog from "./MenuDialog";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Monday is 0, matching the API's serving_days. */
function weekdayIndex(date: string): number {
  return (parseISODate(date).getDay() + 6) % 7;
}

interface Editing {
  date: string;
  meal: Meal;
  menu: Menu | undefined;
}

/** Admins publish the week's menus here and set when each meal is served. */
export default function MenusPage() {
  const today = todayISO();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [editing, setEditing] = useState<Editing | null>(null);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const meals = useGetMealsQuery();
  const menus = useGetMenusQuery({ date_from: weekStart, date_to: weekEnd });
  const error = meals.error ?? menus.error;
  const activeMeals = (meals.data ?? []).filter((meal) => meal.is_active);

  function menuFor(date: string, meal: Meal): Menu | undefined {
    return (menus.data ?? []).find((menu) => menu.date === date && menu.meal === meal.id);
  }

  return (
    <Stack spacing={4}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ alignItems: { md: "flex-end" }, justifyContent: "space-between" }}
      >
        <Stack spacing={1}>
          <Typography variant="h1">Menus</Typography>
          <Typography color="text.secondary">
            {formatDate(weekStart, { day: "numeric", month: "long" })} to{" "}
            {formatDate(weekEnd, { day: "numeric", month: "long", year: "numeric" })}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button color="inherit" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            Previous week
          </Button>
          <Button color="inherit" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Next week
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{errorMessage(error, "The menus could not be loaded.")}</Alert>}

      <Stack component="section" aria-label="Menus by day" spacing={2}>
        {eachDay(weekStart, weekEnd).map((date) => {
          const served = activeMeals.filter((meal) => meal.serving_days.includes(weekdayIndex(date)));
          return (
            <Card key={date} component="article" sx={{ p: 2.5 }}>
              <Stack spacing={1.5}>
                <Typography variant="h3" component="h2">
                  {formatDate(date, { weekday: "long", day: "numeric", month: "long" })}
                </Typography>
                {served.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Nothing is served on this day.
                  </Typography>
                )}
                {served.map((meal) => {
                  const menu = menuFor(date, meal);
                  return (
                    <Stack
                      key={meal.id}
                      direction="row"
                      spacing={2}
                      sx={{ alignItems: "center", justifyContent: "space-between" }}
                    >
                      <Stack direction="row" spacing={2} sx={{ alignItems: "center", minWidth: 0 }}>
                        {menu?.photo && (
                          <Box
                            component="img"
                            src={menu.photo}
                            alt=""
                            sx={{ width: 56, height: 56, objectFit: "cover", borderRadius: "10px", flex: "none" }}
                          />
                        )}
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700 }}>{meal.name}</Typography>
                          <Typography variant="body2" color={menu ? "text.primary" : "text.secondary"}>
                            {menu ? menu.description : "No menu published yet."}
                          </Typography>
                        </Box>
                      </Stack>
                      <Button
                        size="small"
                        variant={menu ? "outlined" : "contained"}
                        onClick={() => setEditing({ date, meal, menu })}
                        aria-label={`${menu ? "Edit" : "Add"} ${meal.name} menu for ${formatDate(date, { weekday: "long", day: "numeric", month: "long" })}`}
                        sx={{ flex: "none" }}
                      >
                        {menu ? "Edit" : "Add"}
                      </Button>
                    </Stack>
                  );
                })}
              </Stack>
            </Card>
          );
        })}
      </Stack>

      <Stack component="section" aria-labelledby="meals-heading" spacing={2}>
        <Box>
          <Typography variant="h2" id="meals-heading">
            Meals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When each meal is served, and when booking for it closes.
          </Typography>
        </Box>
        <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {(meals.data ?? []).map((meal) => (
            <Card key={meal.id} component="article" sx={{ p: 2.5 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Typography variant="h3">{meal.name}</Typography>
                  {!meal.is_active && <Chip size="small" label="Not offered" />}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Served at {meal.serve_time.slice(0, 5)} on{" "}
                  {meal.serving_days.map((day) => WEEKDAYS[day]).join(", ")}. Booking closes at{" "}
                  {meal.cutoff_time.slice(0, 5)}
                  {meal.cutoff_days_before === 0
                    ? " the same day"
                    : meal.cutoff_days_before === 1
                      ? " the day before"
                      : ` ${meal.cutoff_days_before} days before`}
                  .
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setEditingMeal(meal)}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Change
                </Button>
              </Stack>
            </Card>
          ))}
        </Box>
      </Stack>

      {editing && (
        <MenuDialog date={editing.date} meal={editing.meal} menu={editing.menu} onClose={() => setEditing(null)} />
      )}
      {editingMeal && <MealDialog meal={editingMeal} onClose={() => setEditingMeal(null)} />}
    </Stack>
  );
}
