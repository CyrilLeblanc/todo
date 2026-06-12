import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // En dev local : proxy /api → backend sur port 3001
    proxy: { "/api": "http://localhost:3001" },
  },
});
