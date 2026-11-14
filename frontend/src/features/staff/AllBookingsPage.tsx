import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { useGetProfileQuery } from "../../api/authApi";
import { useCancelBookingMutation, useGetMealsQuery } from "../../api/bookingApi";
import { errorMessage } from "../../api/errors";
import { type AllBookingsQuery, useGetAllBookingsQuery } from "../../api/kitchenApi";
import { DIETARY_LABELS, type Booking } from "../../api/types";
import { addDays, formatDate, formatTime, todayISO } from "../../lib/dates";

const PAGE_SIZE = 20;
type StatusFilter = "" | "collected" | "not_collected";

interface Notice {
  severity: "success" | "error";
  text: string;
}

/** Every booking in the canteen, for staff and admins, one page at a time. */
export default function AllBookingsPage() {
  const today = todayISO();
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(addDays(today, 6));
  const [meal, setMeal] = useState<number | "">("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Wait until typing pauses before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const query: AllBookingsQuery = { page };
  if (dateFrom) query.date_from = dateFrom;
  if (dateTo) query.date_to = dateTo;
  if (meal !== "") query.meal = meal;
  if (status !== "") query.status = status;
  if (search) query.search = search;

  const { data: user } = useGetProfileQuery();
  const { data: meals } = useGetMealsQuery();
  const { data, error, isLoading, isFetching } = useGetAllBookingsQuery(query);
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation();
  const isAdmin = user?.role === "admin";
  const pageCount = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  // Any change of filter starts again from the first page.
  function filter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  async function handleCancel(booking: Booking) {
    try {
      await cancelBooking(booking.id).unwrap();
      setNotice({ severity: "success", text: `Booking for ${booking.guest_name || booking.user_name} cancelled.` });
    } catch (cancelError) {
      setNotice({ severity: "error", text: errorMessage(cancelError) });
    }
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h1">All bookings</Typography>
        <Typography color="text.secondary" aria-live="polite">
          {data ? `${data.count} ${data.count === 1 ? "booking" : "bookings"} match.` : "Loading…"}
        </Typography>
      </Stack>

      <Box
        component="form"
        role="search"
        aria-label="Filter bookings"
        onSubmit={(event) => event.preventDefault()}
        sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        <TextField
          label="Name, email or guest"
          size="small"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <TextField
          label="From"
          type="date"
          size="small"
          value={dateFrom}
          onChange={(event) => filter(setDateFrom)(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="To"
          type="date"
          size="small"
          value={dateTo}
          onChange={(event) => filter(setDateTo)(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          select
          label="Meal"
          size="small"
          value={meal}
          onChange={(event) => filter(setMeal)(event.target.value === "" ? "" : Number(event.target.value))}
        >
          <MenuItem value="">All meals</MenuItem>
          {(meals ?? []).map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Status"
          size="small"
          value={status}
          onChange={(event) => filter(setStatus)(event.target.value as StatusFilter)}
        >
          <MenuItem value="">Any status</MenuItem>
          <MenuItem value="collected">Collected</MenuItem>
          <MenuItem value="not_collected">Not collected</MenuItem>
        </TextField>
      </Box>

      {error && <Alert severity="error">{errorMessage(error, "The bookings could not be loaded.")}</Alert>}

      <Card sx={{ opacity: isFetching && !isLoading ? 0.6 : 1 }}>
        <TableContainer>
          <Table aria-label="Bookings">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Meal</TableCell>
                <TableCell>Who</TableCell>
                <TableCell>Diet</TableCell>
                <TableCell>Status</TableCell>
                {isAdmin && <TableCell align="right">Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.results ?? []).map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {formatDate(booking.date, { weekday: "short", day: "numeric", month: "short" })}
                  </TableCell>
                  <TableCell>{booking.meal_name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {booking.is_guest ? `${booking.guest_name} (guest)` : booking.user_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.is_guest ? `Booked by ${booking.user_name}` : booking.user_email}
                    </Typography>
                  </TableCell>
                  <TableCell>{DIETARY_LABELS[booking.dietary_preference]}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {booking.is_redeemed && booking.redeemed_at
                      ? `Collected ${formatTime(booking.redeemed_at)}`
                      : booking.date < today
                        ? "Not collected"
                        : "Booked"}
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      {!booking.is_redeemed && booking.date >= today && (
                        <Button
                          size="small"
                          color="inherit"
                          disabled={cancelling}
                          onClick={() => handleCancel(booking)}
                          aria-label={`Cancel ${booking.meal_name} for ${booking.guest_name || booking.user_name} on ${formatDate(booking.date, { weekday: "long", day: "numeric", month: "long" })}`}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {data && data.results.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5}>
                    <Typography color="text.secondary">No bookings match these filters.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {pageCount > 1 && (
        <Stack sx={{ alignItems: "center" }}>
          <Pagination
            color="primary"
            count={pageCount}
            page={Math.min(page, pageCount)}
            onChange={(_event, value) => setPage(value)}
            aria-label="Pages of bookings"
          />
        </Stack>
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
