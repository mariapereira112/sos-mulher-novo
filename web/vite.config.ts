import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // DEV: proxy /api → Spring Boot (porta 8080)
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },

  // BUILD: compila direto na pasta de estáticos do Spring Boot
  build: {
    outDir: "../backend/src/main/resources/static",
    emptyOutDir: true,
  },
});
