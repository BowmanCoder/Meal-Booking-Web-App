import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { Provider } from "react-redux";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { store } from "./app/store";
import AppShell from "./components/AppShell";
import AccountPage from "./features/account/AccountPage";
import MenusPage from "./features/admin/MenusPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import RequireAuth from "./features/auth/RequireAuth";
import RequireRole from "./features/auth/RequireRole";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";
import MyBookingsPage from "./features/booking/MyBookingsPage";
import WeekPage from "./features/booking/WeekPage";
import KitchenPage from "./features/staff/KitchenPage";
import ScannerPage from "./features/staff/ScannerPage";
import { theme } from "./theme";

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme} defaultMode="system">
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<WeekPage />} />
                <Route path="/bookings" element={<MyBookingsPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route element={<RequireRole roles={["staff", "admin"]} />}>
                  <Route path="/scan" element={<ScannerPage />} />
                  <Route path="/kitchen" element={<KitchenPage />} />
                </Route>
                <Route element={<RequireRole roles={["admin"]} />}>
                  <Route path="/menus" element={<MenusPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
