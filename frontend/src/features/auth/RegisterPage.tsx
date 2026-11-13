import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type FormEvent, useState } from "react";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";

import { useRegisterMutation } from "../../api/authApi";
import { errorMessage } from "../../api/errors";
import { DIETARY_LABELS, type DietaryPreference } from "../../api/types";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import AuthLayout from "./AuthLayout";
import { setTokens } from "./authSlice";

export default function RegisterPage() {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [diet, setDiet] = useState<DietaryPreference>("none");
  const [register, { isLoading, error }] = useRegisterMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const signedIn = useAppSelector((state) => Boolean(state.auth.access));

  if (signedIn) return <Navigate to="/" replace />;

  const mismatch = password2.length > 0 && password !== password2;
  const incomplete = !fullname.trim() || !email || !password || !password2;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const response = await register({
        fullname: fullname.trim(),
        email,
        password,
        password2,
        dietary_preference: diet,
      }).unwrap();
      dispatch(setTokens(response.token));
      navigate("/", { replace: true });
    } catch {
      // The error is shown from the mutation state below.
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="It takes less than a minute.">
      <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
        {error && <Alert severity="error">{errorMessage(error)}</Alert>}
        <TextField
          label="Full name"
          autoComplete="name"
          required
          autoFocus
          value={fullname}
          onChange={(event) => setFullname(event.target.value)}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          select
          label="Dietary preference"
          helperText="The kitchen uses this to plan. You can change it later."
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
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          helperText="At least 8 characters, and not only numbers."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <TextField
          label="Repeat password"
          type="password"
          autoComplete="new-password"
          required
          error={mismatch}
          helperText={mismatch ? "The two passwords do not match." : " "}
          value={password2}
          onChange={(event) => setPassword2(event.target.value)}
        />
        <Button type="submit" variant="contained" size="large" disabled={isLoading || incomplete || mismatch}>
          {isLoading ? "Creating account…" : "Create account"}
        </Button>
        <Typography color="text.secondary">
          Already registered?{" "}
          <Link component={RouterLink} to="/login">
            Sign in
          </Link>
        </Typography>
      </Stack>
    </AuthLayout>
  );
}
