import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { Provider } from "react-redux";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { store } from "./app/store";
import AppShell from "./components/AppShell";
import AccountPage from "./features/account/AccountPage";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import RequireAuth from "./features/auth/RequireAuth";
import MyBookingsPage from "./features/booking/MyBookingsPage";
import WeekPage from "./features/booking/WeekPage";
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
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<WeekPage />} />
                <Route path="/bookings" element={<MyBookingsPage />} />
                <Route path="/account" element={<AccountPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
