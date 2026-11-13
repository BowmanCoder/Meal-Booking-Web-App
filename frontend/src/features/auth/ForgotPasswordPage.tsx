import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { type FormEvent, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { useRequestPasswordResetMutation } from "../../api/authApi";
import { errorMessage } from "../../api/errors";
import AuthLayout from "./AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [requestReset, { isLoading, isSuccess, error }] = useRequestPasswordResetMutation();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await requestReset({ email }).unwrap().catch(() => undefined);
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="We will email you a link to choose a new one.">
      <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
        {error && <Alert severity="error">{errorMessage(error)}</Alert>}
        {isSuccess ? (
          // The same message whether or not the address is registered.
          <Alert severity="success">
            If that email is registered, a reset link is on its way. It works for 15 minutes.
          </Alert>
        ) : (
          <>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button type="submit" variant="contained" size="large" disabled={isLoading || !email}>
              {isLoading ? "Sending…" : "Send reset link"}
            </Button>
          </>
        )}
        <Link component={RouterLink} to="/login">
          Back to sign in
        </Link>
      </Stack>
    </AuthLayout>
  );
}
