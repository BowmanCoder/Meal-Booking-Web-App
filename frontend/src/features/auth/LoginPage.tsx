import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type FormEvent, useState } from "react";
import { Link as RouterLink, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useLoginMutation } from "../../api/authApi";
import { errorMessage } from "../../api/errors";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import AuthLayout from "./AuthLayout";
import { setTokens } from "./authSlice";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const signedIn = useAppSelector((state) => Boolean(state.auth.access));
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  if (signedIn) return <Navigate to={from} replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const response = await login({ email, password }).unwrap();
      dispatch(setTokens(response.token));
      navigate(from, { replace: true });
    } catch {
      // The error is shown from the mutation state below.
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Book your meals for the week.">
      <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
        {error && <Alert severity="error">{errorMessage(error)}</Alert>}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" variant="contained" size="large" disabled={isLoading || !email || !password}>
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>
        <Typography color="text.secondary">
          New here?{" "}
          <Link component={RouterLink} to="/register">
            Create an account
          </Link>
        </Typography>
      </Stack>
    </AuthLayout>
  );
}
