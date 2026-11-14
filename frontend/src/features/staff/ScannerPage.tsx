import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import QrScanner from "qr-scanner";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { errorMessage } from "../../api/errors";
import { useGetPrepSheetQuery, useRedeemCouponMutation } from "../../api/kitchenApi";
import { DIETARY_LABELS, type RedeemResponse, type RedeemResult } from "../../api/types";
import { formatDate, formatTime, todayISO } from "../../lib/dates";

const HEADLINES: Record<RedeemResult, string> = {
  redeemed: "Valid",
  already_redeemed: "Already used",
  wrong_day: "Wrong day",
  not_found: "Not found",
};

interface PastScan {
  id: number;
  result: RedeemResult;
  who: string;
}

function who(response: RedeemResponse): string {
  const booking = response.booking;
  if (!booking) return "Unknown coupon";
  return booking.is_guest ? `${booking.guest_name} (guest of ${booking.user_name})` : booking.user_name;
}

/** Canteen staff scan a diner's QR coupon here; each coupon works once. */
export default function ScannerPage() {
  const today = todayISO();
  const videoRef = useRef<HTMLVideoElement>(null);
  // While a result is on screen, further reads of the same code are ignored.
  const busyRef = useRef(false);
  const [outcome, setOutcome] = useState<RedeemResponse | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [history, setHistory] = useState<PastScan[]>([]);
  const [redeem, { isLoading }] = useRedeemCouponMutation();
  const { data: prep } = useGetPrepSheetQuery(today);

  async function submit(code: string) {
    const trimmed = code.trim();
    if (busyRef.current || trimmed === "") return;
    busyRef.current = true;
    setFailure(null);
    try {
      const response = await redeem(trimmed).unwrap();
      setOutcome(response);
      setHistory((past) => [{ id: Date.now(), result: response.result, who: who(response) }, ...past].slice(0, 5));
    } catch (error) {
      setFailure(errorMessage(error, "The coupon could not be checked. Try again."));
      busyRef.current = false;
    }
  }

  // The camera callback is created once, so it reaches the latest `submit` through a ref.
  const submitRef = useRef(submit);
  submitRef.current = submit;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const scanner = new QrScanner(video, (result) => void submitRef.current(result.data), {
      returnDetailedScanResult: true,
      highlightScanRegion: true,
      maxScansPerSecond: 5,
      preferredCamera: "environment",
    });
    scanner.start().catch(() => {
      setCameraError("The camera could not be started. Allow camera access, or type the code below.");
    });
    return () => scanner.destroy();
  }, []);

  function scanNext() {
    setOutcome(null);
    setManualCode("");
    busyRef.current = false;
  }

  function handleManual(event: FormEvent) {
    event.preventDefault();
    void submit(manualCode);
  }

  const booking = outcome?.booking;
  const valid = outcome?.result === "redeemed";

  return (
    <Stack spacing={3} sx={{ maxWidth: 480, mx: "auto" }}>
      <Stack spacing={1}>
        <Typography variant="h1">Scan coupon</Typography>
        <Typography color="text.secondary">
          {formatDate(today, { weekday: "long", day: "numeric", month: "long" })}
        </Typography>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          {(prep?.meals ?? [])
            .filter((meal) => meal.is_served)
            .map((meal) => (
              <Chip key={meal.meal} label={`${meal.meal_name}: ${meal.redeemed} of ${meal.total} collected`} />
            ))}
        </Stack>
      </Stack>

      {cameraError && <Alert severity="warning">{cameraError}</Alert>}
      <Box
        sx={{
          position: "relative",
          borderRadius: "24px",
          overflow: "hidden",
          bgcolor: "#18181B",
          aspectRatio: "4 / 3",
          display: cameraError ? "none" : "block",
        }}
      >
        <Box
          component="video"
          ref={videoRef}
          muted
          playsInline
          aria-label="Camera view for scanning a coupon"
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </Box>

      <Box aria-live="assertive">
        {failure && <Alert severity="error">{failure}</Alert>}
        {outcome && (
          <Stack
            spacing={1}
            sx={{
              p: 3,
              borderRadius: "24px",
              color: valid ? "success.contrastText" : "error.contrastText",
              bgcolor: valid ? "success.main" : "error.main",
            }}
          >
            <Typography variant="h1" component="p">
              {HEADLINES[outcome.result]}
            </Typography>
            <Typography>{outcome.message}</Typography>
            {booking && (
              <>
                <Typography sx={{ fontWeight: 700, fontSize: 20 }}>{who(outcome)}</Typography>
                <Typography>
                  {booking.meal_name}, {formatDate(booking.date, { weekday: "short", day: "numeric", month: "short" })}.{" "}
                  {DIETARY_LABELS[booking.dietary_preference]}.
                </Typography>
                {outcome.result === "already_redeemed" && booking.redeemed_at && (
                  <Typography>Collected at {formatTime(booking.redeemed_at)}.</Typography>
                )}
              </>
            )}
          </Stack>
        )}
      </Box>

      {outcome ? (
        <Button variant="contained" size="large" onClick={scanNext} autoFocus>
          Scan next
        </Button>
      ) : (
        <Stack component="form" direction="row" spacing={1} onSubmit={handleManual} noValidate>
          <TextField
            label="Or type the coupon code"
            size="small"
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            slotProps={{ htmlInput: { autoCapitalize: "off", autoCorrect: "off", spellCheck: false } }}
          />
          <Button type="submit" variant="outlined" disabled={isLoading || manualCode.trim() === ""}>
            Check
          </Button>
        </Stack>
      )}

      {history.length > 0 && (
        <Stack component="section" aria-label="Recent scans" spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            Recent scans
          </Typography>
          {history.map((scan) => (
            <Typography key={scan.id} variant="body2">
              <strong>{HEADLINES[scan.result]}.</strong> {scan.who}
            </Typography>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
