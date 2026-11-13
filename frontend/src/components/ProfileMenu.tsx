import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import { useColorScheme } from "@mui/material/styles";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import {
  useGetProfileQuery,
  useLogoutEverywhereMutation,
  useLogoutMutation,
  useUpdateProfileMutation,
} from "../api/authApi";
import { baseApi } from "../api/baseApi";
import { DIETARY_LABELS, ROLE_LABELS, type DietaryPreference } from "../api/types";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearTokens } from "../features/auth/authSlice";
import { primaryTint } from "../theme";

type Mode = "light" | "dark" | "system";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0][0], parts[parts.length - 1][0]] : [parts[0]?.[0] ?? "?"];
  return letters.join("").toUpperCase();
}

export default function ProfileMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { data: user } = useGetProfileQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();
  const [logout] = useLogoutMutation();
  const [logoutEverywhere] = useLogoutEverywhereMutation();
  const refresh = useAppSelector((state) => state.auth.refresh);
  const dispatch = useAppDispatch();
  const { mode, setMode } = useColorScheme();

  function endSession() {
    dispatch(clearTokens());
    dispatch(baseApi.util.resetApiState());
  }

  async function handleLogout() {
    // Tell the server first, while the access token is still attached.
    if (refresh) await logout({ refresh }).unwrap().catch(() => undefined);
    endSession();
  }

  async function handleLogoutEverywhere() {
    await logoutEverywhere().unwrap().catch(() => undefined);
    endSession();
  }

  const name = user?.fullname ?? "";

  return (
    <>
      <IconButton
        aria-label={user ? `Open profile menu for ${name}` : "Open profile menu"}
        aria-haspopup="dialog"
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ p: 0.5 }}
      >
        <Avatar sx={{ bgcolor: primaryTint, color: "primary.main", fontWeight: 600, fontSize: 15 }}>
          {user ? initials(name) : ""}
        </Avatar>
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 320, maxWidth: "calc(100vw - 32px)", mt: 1, borderRadius: "20px" } } }}
      >
        {user && (
          <Stack spacing={2.5} sx={{ p: 3 }}>
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontWeight: 700 }}>{user.fullname}</Typography>
                <Chip size="small" label={ROLE_LABELS[user.role]} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                {user.email}
              </Typography>
            </Stack>

            <TextField
              select
              size="small"
              label="Dietary preference"
              disabled={saving}
              value={user.dietary_preference}
              onChange={(event) =>
                updateProfile({ dietary_preference: event.target.value as DietaryPreference })
              }
            >
              {Object.entries(DIETARY_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>

            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary" id="appearance-label">
                Appearance
              </Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                aria-labelledby="appearance-label"
                value={mode ?? "system"}
                onChange={(_event, value: Mode | null) => {
                  if (value) setMode(value);
                }}
              >
                <ToggleButton value="light">Light</ToggleButton>
                <ToggleButton value="dark">Dark</ToggleButton>
                <ToggleButton value="system">Device</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <FormControlLabel
              sx={{ justifyContent: "space-between", ml: 0 }}
              labelPlacement="start"
              label="Email me tomorrow's meals"
              control={
                <Switch
                  checked={user.email_reminders}
                  disabled={saving}
                  onChange={(event) => updateProfile({ email_reminders: event.target.checked })}
                />
              }
            />

            <Divider />

            <Stack spacing={1}>
              <Button variant="outlined" onClick={handleLogout}>
                Log out
              </Button>
              <Button color="inherit" onClick={handleLogoutEverywhere}>
                Log out on all devices
              </Button>
            </Stack>
          </Stack>
        )}
      </Popover>
    </>
  );
}
