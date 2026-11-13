import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { type FormEvent, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

import { useResetPasswordMutation } from "../../api/authApi";
import { errorMessage } from "../../api/errors";
import AuthLayout from "./AuthLayout";

/** Reached from the link in a password reset email. */
export default function ResetPasswordPage() {
  const { uid = "", token = "" } = useParams();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [resetPassword, { isLoading, isSuccess, error }] = useResetPasswordMutation();

  const mismatch = password2.length > 0 && password !== password2;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await resetPassword({ uid, token, password, password2 }).unwrap().catch(() => undefined);
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="You will use it the next time you sign in.">
      <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
        {error && <Alert severity="error">{errorMessage(error)}</Alert>}
        {isSuccess ? (
          <>
            <Alert severity="success">Your password has been changed.</Alert>
            <Button component={RouterLink} to="/login" variant="contained" size="large">
              Sign in
            </Button>
          </>
        ) : (
          <>
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              required
              autoFocus
              helperText="At least 8 characters, and not only numbers."
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <TextField
              label="Repeat new password"
              type="password"
              autoComplete="new-password"
              required
              error={mismatch}
              helperText={mismatch ? "The two passwords do not match." : " "}
              value={password2}
              onChange={(event) => setPassword2(event.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading || !password || !password2 || mismatch}
            >
              {isLoading ? "Saving…" : "Change password"}
            </Button>
            <Link component={RouterLink} to="/forgot-password">
              Send a new link
            </Link>
          </>
        )}
      </Stack>
    </AuthLayout>
  );
}
