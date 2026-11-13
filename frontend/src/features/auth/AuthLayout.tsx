import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Centred card used by the login and registration pages. */
export default function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <Box
      component="main"
      sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}
    >
      <Card sx={{ width: "100%", maxWidth: 440, p: { xs: 3, sm: 5 } }}>
        <Stack spacing={3}>
          <Typography
            sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 24, color: "primary.main" }}
          >
            BookMyMeal
          </Typography>
          <Stack spacing={0.5}>
            <Typography variant="h2" component="h1">
              {title}
            </Typography>
            <Typography color="text.secondary">{subtitle}</Typography>
          </Stack>
          {children}
        </Stack>
      </Card>
    </Box>
  );
}
