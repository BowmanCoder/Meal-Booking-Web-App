import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import { NavLink, Outlet } from "react-router-dom";

import ProfileMenu from "./ProfileMenu";

const NAV_LINKS = [{ to: "/", label: "This week" }];

/** Page frame for signed-in screens: top bar, navigation, profile menu. */
export default function AppShell() {
  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 72, justifyContent: "space-between", gap: 2 }}>
            <Link
              component={NavLink}
              to="/"
              underline="none"
              sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 24, color: "primary.main" }}
            >
              BookMyMeal
            </Link>
            <Stack direction="row" spacing={3} component="nav" aria-label="Main" sx={{ alignItems: "center" }}>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  component={NavLink}
                  to={link.to}
                  end
                  underline="none"
                  sx={{
                    color: "text.secondary",
                    fontSize: 15,
                    "&.active": { color: "text.primary", fontWeight: 600 },
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <ProfileMenu />
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
