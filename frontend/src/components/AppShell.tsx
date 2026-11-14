import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import { NavLink, Outlet } from "react-router-dom";

import { useGetProfileQuery } from "../api/authApi";
import ProfileMenu from "./ProfileMenu";

const EVERYONE = [
  { to: "/", label: "This week" },
  { to: "/bookings", label: "My bookings" },
];
const STAFF = [
  { to: "/scan", label: "Scan" },
  { to: "/kitchen", label: "Kitchen" },
  { to: "/all-bookings", label: "All bookings" },
];
const ADMIN = [{ to: "/menus", label: "Menus" }];

/** Page frame for signed-in screens: top bar, navigation, profile menu. */
export default function AppShell() {
  // Staff and admins get extra links; the server enforces the actual access.
  const { data: user } = useGetProfileQuery();
  const links = [
    ...EVERYONE,
    ...(user && user.role !== "employee" ? STAFF : []),
    ...(user?.role === "admin" ? ADMIN : []),
  ];

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}
      >
        <Container maxWidth="lg">
          {/* Wide screens: brand, links and profile in one row. Phones: brand and
              profile on top, with the links in one swipeable row underneath. */}
          <Toolbar
            disableGutters
            sx={{ minHeight: { xs: 56, md: 72 }, flexWrap: "wrap", columnGap: 3, py: { xs: 0.5, md: 1 } }}
          >
            <Link
              component={NavLink}
              to="/"
              underline="none"
              sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 24, color: "primary.main" }}
            >
              BookMyMeal
            </Link>
            <Stack
              direction="row"
              component="nav"
              aria-label="Main"
              sx={{
                order: { xs: 3, md: 2 },
                width: { xs: "100%", md: "auto" },
                ml: { md: "auto" },
                alignItems: "center",
                columnGap: 3,
                overflowX: "auto",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {links.map((link) => (
                <Link
                  key={link.to}
                  component={NavLink}
                  to={link.to}
                  end
                  underline="none"
                  sx={{
                    flexShrink: 0,
                    py: 1,
                    whiteSpace: "nowrap",
                    color: "text.secondary",
                    fontSize: 15,
                    "&.active": { color: "text.primary", fontWeight: 600 },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
            <Box sx={{ order: { xs: 2, md: 3 }, ml: { xs: "auto", md: 0 } }}>
              <ProfileMenu />
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
