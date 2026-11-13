import Typography from "@mui/material/Typography";
import { Navigate, Outlet } from "react-router-dom";

import { useGetProfileQuery } from "../../api/authApi";
import type { Role } from "../../api/types";

/**
 * Keeps a screen to certain roles. This is only for a tidy interface: the
 * server checks the role on every request, so hiding a page protects nothing.
 */
export default function RequireRole({ roles }: { roles: Role[] }) {
  const { data: user, isLoading } = useGetProfileQuery();
  if (isLoading) return <Typography color="text.secondary">Loading…</Typography>;
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
