import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type FormEvent, useEffect, useState } from "react";

import { useChangePasswordMutation, useGetProfileQuery, useUpdateProfileMutation } from "../../api/authApi";
import { errorMessage } from "../../api/errors";

function NameForm() {
  const { data: user } = useGetProfileQuery();
  const [fullname, setFullname] = useState("");
  const [updateProfile, { isLoading, isSuccess, error, reset }] = useUpdateProfileMutation();

  // Fill the field once the profile has loaded.
  useEffect(() => {
    if (user) setFullname(user.fullname);
  }, [user]);

  const name = fullname.trim();
  const unchanged = !user || name === user.fullname;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await updateProfile({ fullname: name }).unwrap().catch(() => undefined);
  }

  return (
    <Card component="section" aria-labelledby="name-heading" sx={{ p: { xs: 3, sm: 4 } }}>
      <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
        <Typography variant="h2" id="name-heading">
          Name
        </Typography>
        {error && <Alert severity="error">{errorMessage(error)}</Alert>}
        {isSuccess && unchanged && <Alert severity="success">Your name has been updated.</Alert>}
        <TextField
          label="Full name"
          autoComplete="name"
          required
          value={fullname}
          onChange={(event) => {
            setFullname(event.target.value);
            reset();
          }}
        />
        <TextField label="Email" value={user?.email ?? ""} disabled helperText="Your email cannot be changed here." />
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading || unchanged || name === ""}
          sx={{ alignSelf: "flex-start" }}
        >
          {isLoading ? "Saving…" : "Save name"}
        </Button>
      </Stack>
    </Card>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [changePassword, { isLoading, isSuccess, error, reset }] = useChangePasswordMutation();

  const mismatch = password2.length > 0 && password !== password2;
  const incomplete = !current || !password || !password2;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await changePassword({ current_password: current, password, password2 }).unwrap();
      setCurrent("");
      setPassword("");
      setPassword2("");
    } catch {
      // The error is shown from the mutation state below.
    }
  }

  return (
    <Card component="section" aria-labelledby="password-heading" sx={{ p: { xs: 3, sm: 4 } }}>
      <Stack component="form" spacing={2} onSubmit={handleSubmit} onChange={() => isSuccess && reset()} noValidate>
        <Typography variant="h2" id="password-heading">
          Password
        </Typography>
        {error && <Alert severity="error">{errorMessage(error)}</Alert>}
        {isSuccess && <Alert severity="success">Your password has been changed.</Alert>}
        <TextField
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
        />
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          required
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
          disabled={isLoading || incomplete || mismatch}
          sx={{ alignSelf: "flex-start" }}
        >
          {isLoading ? "Changing…" : "Change password"}
        </Button>
      </Stack>
    </Card>
  );
}

/** Edit your name and change your password. */
export default function AccountPage() {
  return (
    <Stack spacing={4} sx={{ maxWidth: 560 }}>
      <Typography variant="h1">Name and password</Typography>
      <NameForm />
      <PasswordForm />
    </Stack>
  );
}
