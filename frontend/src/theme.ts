import { createTheme } from "@mui/material/styles";

const headingFont = '"Space Grotesk", Inter, system-ui, sans-serif';

// One theme, two colour schemes. Components read colours from the theme, so
// light and dark mode never need per-screen overrides.
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#6D28D9", dark: "#5B21B6", contrastText: "#FFFFFF" },
        background: { default: "#FAFAFA", paper: "#FFFFFF" },
        text: { primary: "#18181B", secondary: "#52525B" },
        divider: "#E4E4E7",
        success: { main: "#15803D" },
        error: { main: "#B91C1C" },
      },
    },
    dark: {
      palette: {
        // Lighter purple with dark text keeps buttons and links readable.
        primary: { main: "#A78BFA", dark: "#8B5CF6", contrastText: "#1C1033" },
        background: { default: "#0F0F12", paper: "#1C1C21" },
        text: { primary: "#F4F4F5", secondary: "#A1A1AA" },
        divider: "#2E2E36",
        success: { main: "#4ADE80" },
        error: { main: "#F87171" },
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    h1: { fontFamily: headingFont, fontWeight: 700, fontSize: "2.5rem", lineHeight: 1.15 },
    h2: { fontFamily: headingFont, fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.25 },
    h3: { fontFamily: headingFont, fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.3 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, minHeight: 44, paddingInline: 20 },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundImage: "none",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
        },
      },
    },
    MuiTextField: { defaultProps: { fullWidth: true } },
  },
});

// A soft tint of the primary colour that works in both colour schemes.
export const primaryTint = "rgba(var(--mui-palette-primary-mainChannel) / 0.12)";
