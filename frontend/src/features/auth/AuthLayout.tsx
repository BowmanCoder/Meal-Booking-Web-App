import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

// The picture is optional: if src/assets/auth-hero.* does not exist, the
// pages fall back to the form on its own instead of failing to build.
const heroImages = import.meta.glob<string>("../../assets/auth-hero.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});
const heroImage: string | undefined = Object.values(heroImages)[0];

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Frame for the sign-in, registration and password reset pages. */
export default function AuthLayout({ title, subtitle, children }: Props) {
  const form = (
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
  );

  if (!heroImage) {
    return (
      <Box
        component="main"
        sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}
      >
        <Card sx={{ width: "100%", maxWidth: 440, p: { xs: 3, sm: 5 } }}>{form}</Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
      <Box
        component="main"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 4 },
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 400, py: 4 }}>{form}</Box>
      </Box>
      {/* Decorative, and hidden on phones, where the form needs the whole screen. */}
      <Box
        aria-hidden
        sx={{
          display: { xs: "none", md: "block" },
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </Box>
  );
}
