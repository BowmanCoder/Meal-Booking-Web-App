import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAppSelector } from "../../app/hooks";

/** Sends signed-out visitors to the login page, remembering where they were going. */
export default function RequireAuth() {
  const signedIn = useAppSelector((state) => Boolean(state.auth.access));
  const location = useLocation();
  if (!signedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
