
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Configuração para publicação no GitHub Pages
  base: mode === "github" ? "/sos-mulher-novo/" : "/",

  // Servidor local
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },

  // Mantém o build original do Spring Boot
  // e cria uma pasta separada para o GitHub Pages.
  build: {
    outDir:
      mode === "github"
        ? "../dist-github"
        : "../backend/src/main/resources/static",
    emptyOutDir: true,
  },
}));
