import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Port 3000 matches the backend's default CORS and email-link settings.
  server: { port: 3000 },
  preview: { port: 3000 },
});
