import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { type FormEvent, useState } from "react";

import { errorMessage } from "../../api/errors";
import { useUpdateMealMutation } from "../../api/kitchenApi";
import type { Meal } from "../../api/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Change when a meal is served and when booking for it closes. */
export default function MealDialog({ meal, onClose }: { meal: Meal; onClose: () => void }) {
  const [serveTime, setServeTime] = useState(meal.serve_time.slice(0, 5));
  const [cutoffTime, setCutoffTime] = useState(meal.cutoff_time.slice(0, 5));
  const [daysBefore, setDaysBefore] = useState(meal.cutoff_days_before);
  const [servingDays, setServingDays] = useState<number[]>(meal.serving_days);
  const [isActive, setIsActive] = useState(meal.is_active);
  const [updateMeal, { isLoading, error }] = useUpdateMealMutation();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await updateMeal({
        id: meal.id,
        body: {
          serve_time: serveTime,
          cutoff_time: cutoffTime,
          cutoff_days_before: daysBefore,
          serving_days: servingDays,
          is_active: isActive,
        },
      }).unwrap();
      onClose();
    } catch {
      // The error is shown from the mutation state below.
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="meal-dialog-title">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle id="meal-dialog-title">{meal.name} settings</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{errorMessage(error)}</Alert>}

            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary" id="serving-days-label">
                Served on
              </Typography>
              <ToggleButtonGroup
                fullWidth
                size="small"
                aria-labelledby="serving-days-label"
                value={servingDays}
                onChange={(_event, value: number[]) => setServingDays(value)}
              >
                {WEEKDAYS.map((label, index) => (
                  <ToggleButton key={label} value={index}>
                    {label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>

            <TextField
              label="Served at"
              type="time"
              required
              value={serveTime}
              onChange={(event) => setServeTime(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Booking closes at"
                type="time"
                required
                value={cutoffTime}
                onChange={(event) => setCutoffTime(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                select
                label="On"
                value={daysBefore}
                onChange={(event) => setDaysBefore(Number(event.target.value))}
              >
                <MenuItem value={0}>The same day</MenuItem>
                <MenuItem value={1}>The day before</MenuItem>
                <MenuItem value={2}>Two days before</MenuItem>
              </TextField>
            </Stack>

            <FormControlLabel
              sx={{ justifyContent: "space-between", ml: 0 }}
              labelPlacement="start"
              label="Offered for booking"
              control={<Switch checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" onClick={onClose}>
            Close
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || servingDays.length === 0 || !serveTime || !cutoffTime}
          >
            {isLoading ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
