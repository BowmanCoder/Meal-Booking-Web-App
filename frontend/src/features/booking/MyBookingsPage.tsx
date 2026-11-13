import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Pagination from "@mui/material/Pagination";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { useCancelBookingMutation, useGetMyBookingsQuery } from "../../api/bookingApi";
import { errorMessage } from "../../api/errors";
import { DIETARY_LABELS, type Booking } from "../../api/types";
import { addDays, formatDate, formatDateTime, formatTime, todayISO } from "../../lib/dates";
import { primaryTint } from "../../theme";
import GuestBookingDialog from "./GuestBookingDialog";

type Tab = "upcoming" | "past";
const PAGE_SIZE = 5;
const LONG_DATE: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };

interface Notice {
  severity: "success" | "error";
  text: string;
}

function statusLine(booking: Booking, tab: Tab): string {
  if (booking.is_redeemed && booking.redeemed_at) return `Collected at ${formatTime(booking.redeemed_at)}`;
  if (tab === "past") return "Not collected";
  return booking.can_cancel ? `Cancel until ${formatDateTime(booking.cutoff)}` : "Too late to cancel";
}

/** Every booking the signed-in user has made, with its coupon. */
export default function MyBookingsPage() {
  const today = todayISO();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const couponRef = useRef<HTMLDivElement>(null);
  const [guestOpen, setGuestOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const upcoming = useGetMyBookingsQuery({ date_from: today });
  const past = useGetMyBookingsQuery({ date_to: addDays(today, -1) }, { skip: tab !== "past" });
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation();

  const query = tab === "upcoming" ? upcoming : past;
  // Newest first for history, soonest first for what is coming.
  const allBookings = tab === "upcoming" ? (upcoming.data ?? []) : [...(past.data ?? [])].reverse();
  const pageCount = Math.max(1, Math.ceil(allBookings.length / PAGE_SIZE));
  // If the last booking on the final page is cancelled, fall back a page.
  const currentPage = Math.min(page, pageCount);
  const bookings = allBookings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const usable = (upcoming.data ?? []).filter((booking) => !booking.is_redeemed);
  const selected = usable.find((booking) => booking.id === selectedId) ?? usable[0];

  function showTab(next: Tab) {
    setTab(next);
    setPage(1);
  }

  function showCoupon(booking: Booking) {
    setSelectedId(booking.id);
    // On a phone the coupon sits above the list, so bring it into view.
    couponRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function handleCancel(booking: Booking) {
    try {
      await cancelBooking(booking.id).unwrap();
      setNotice({ severity: "success", text: `${booking.meal_name} on ${formatDate(booking.date, LONG_DATE)} cancelled.` });
    } catch (error) {
      setNotice({ severity: "error", text: errorMessage(error) });
    }
  }

  return (
    <Stack spacing={4}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ alignItems: { md: "flex-end" }, justifyContent: "space-between" }}
      >
        <Typography variant="h1">My bookings</Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          <Stack direction="row" spacing={1} role="group" aria-label="Which bookings to show">
            <Button
              variant={tab === "upcoming" ? "contained" : "outlined"}
              aria-pressed={tab === "upcoming"}
              onClick={() => showTab("upcoming")}
            >
              Upcoming
            </Button>
            <Button
              variant={tab === "past" ? "contained" : "outlined"}
              aria-pressed={tab === "past"}
              onClick={() => showTab("past")}
            >
              Past
            </Button>
          </Stack>
          <Button color="inherit" onClick={() => setGuestOpen(true)}>
            Book for a guest
          </Button>
        </Stack>
      </Stack>

      {query.error && <Alert severity="error">{errorMessage(query.error, "Your bookings could not be loaded.")}</Alert>}

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 3 }}>
        <Stack component="section" aria-label={`${tab} bookings`} spacing={2} sx={{ flex: "2 1 480px", minWidth: 0 }}>
          {query.isLoading && <Typography color="text.secondary">Loading your bookings…</Typography>}

          {query.isSuccess && allBookings.length === 0 && (
            <Card sx={{ p: 3 }}>
              <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
                <Typography color="text.secondary">
                  {tab === "upcoming" ? "You have no meals booked yet." : "No past bookings."}
                </Typography>
                {tab === "upcoming" && (
                  <Button component={RouterLink} to="/" variant="contained">
                    See this week's menu
                  </Button>
                )}
              </Stack>
            </Card>
          )}

          {bookings.map((booking) => {
            const isSelected = tab === "upcoming" && selected?.id === booking.id;
            return (
              <Card
                key={booking.id}
                component="article"
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 2,
                  p: 2.5,
                  border: 2,
                  borderColor: isSelected ? "primary.main" : "transparent",
                }}
              >
                <Box sx={{ flex: "0 0 92px" }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(booking.date, { weekday: "short" })}
                  </Typography>
                  <Typography variant="h3" component="p">
                    {formatDate(booking.date, { day: "numeric", month: "short" })}
                  </Typography>
                </Box>
                <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {booking.meal_name}
                    {booking.is_guest ? `, guest: ${booking.guest_name}` : ""}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {statusLine(booking, tab)}
                  </Typography>
                </Box>
                {tab === "upcoming" && !booking.is_redeemed && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant={isSelected ? "contained" : "outlined"}
                      aria-pressed={isSelected}
                      onClick={() => showCoupon(booking)}
                    >
                      Show coupon
                    </Button>
                    {booking.can_cancel && (
                      <Button
                        size="small"
                        color="inherit"
                        disabled={cancelling}
                        onClick={() => handleCancel(booking)}
                        aria-label={`Cancel ${booking.meal_name} on ${formatDate(booking.date, LONG_DATE)}`}
                      >
                        Cancel
                      </Button>
                    )}
                  </Stack>
                )}
              </Card>
            );
          })}

          {pageCount > 1 && (
            <Stack sx={{ alignItems: "center", pt: 1 }}>
              <Pagination
                color="primary"
                count={pageCount}
                page={currentPage}
                onChange={(_event, value) => setPage(value)}
                aria-label={`Pages of ${tab} bookings`}
              />
            </Stack>
          )}
        </Stack>

        {tab === "upcoming" && selected && (
          <Stack
            component="aside"
            ref={couponRef}
            aria-label="Coupon for the selected booking"
            spacing={2}
            sx={{
              // Above the list on a phone; beside it, and staying in view, on a wide screen.
              order: { xs: -1, md: 0 },
              position: { md: "sticky" },
              top: { md: 96 },
              scrollMarginTop: 96,
              flex: "1 1 280px",
              alignItems: "center",
              textAlign: "center",
              p: 3,
              borderRadius: "24px",
              bgcolor: primaryTint,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
              Your coupon
            </Typography>
            {/* Black on white in both colour schemes, so scanners can read it. */}
            <Box sx={{ p: 2, bgcolor: "#FFFFFF", borderRadius: "16px", lineHeight: 0 }}>
              <QRCodeSVG
                value={selected.coupon_code}
                size={200}
                title={`Coupon for ${selected.meal_name} on ${formatDate(selected.date, LONG_DATE)}`}
              />
            </Box>
            <Box>
              <Typography variant="h2">
                {selected.meal_name}, {formatDate(selected.date, { weekday: "short", day: "numeric", month: "short" })}
              </Typography>
              <Typography color="text.secondary">
                {selected.is_guest
                  ? `Guest: ${selected.guest_name}`
                  : `${selected.user_name}. ${DIETARY_LABELS[selected.dietary_preference]}.`}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Show this at the counter. It works once, on the day of the meal.
            </Typography>
          </Stack>
        )}
      </Box>

      {guestOpen && (
        <GuestBookingDialog
          onClose={() => setGuestOpen(false)}
          onBooked={(guestName) => {
            setGuestOpen(false);
            showTab("upcoming");
            setNotice({ severity: "success", text: `Meal booked for ${guestName}.` });
          }}
        />
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
