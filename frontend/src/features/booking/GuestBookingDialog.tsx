import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { type FormEvent, useState } from "react";

import { useCreateBookingsMutation, useGetMealsQuery } from "../../api/bookingApi";
import { errorMessage } from "../../api/errors";
import { DIETARY_LABELS, type DietaryPreference } from "../../api/types";
import { todayISO } from "../../lib/dates";

interface Props {
  onClose: () => void;
  onBooked: (guestName: string) => void;
}

/** Book one meal for a visitor. The booking gets its own coupon. */
export default function GuestBookingDialog({ onClose, onBooked }: Props) {
  const today = todayISO();
  const { data: meals } = useGetMealsQuery();
  const [mealId, setMealId] = useState<number | "">("");
  const [date, setDate] = useState(today);
  const [guestName, setGuestName] = useState("");
  const [diet, setDiet] = useState<DietaryPreference>("none");
  const [createBookings, { isLoading, error }] = useCreateBookingsMutation();

  const name = guestName.trim();
  const ready = mealId !== "" && date !== "" && name !== "";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (mealId === "" || !ready) return;
    try {
      await createBookings({
        meal: mealId,
        date,
        guest_name: name,
        guest_dietary_preference: diet,
      }).unwrap();
      onBooked(name);
    } catch {
      // The error is shown from the mutation state below.
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="guest-booking-title">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle id="guest-booking-title">Book for a guest</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{errorMessage(error)}</Alert>}
            <TextField
              label="Guest's name"
              required
              autoFocus
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <TextField
              select
              label="Guest's dietary preference"
              helperText="The kitchen counts this in its prep sheet."
              value={diet}
              onChange={(event) => setDiet(event.target.value as DietaryPreference)}
            >
              {Object.entries(DIETARY_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Meal"
              required
              value={mealId}
              onChange={(event) => setMealId(Number(event.target.value))}
            >
              {(meals ?? []).map((meal) => (
                <MenuItem key={meal.id} value={meal.id}>
                  {meal.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Date"
              type="date"
              required
              value={date}
              onChange={(event) => setDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" variant="contained" disabled={!ready || isLoading}>
            {isLoading ? "Booking…" : "Book for guest"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
