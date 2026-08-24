import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env files are not loaded into process.env automatically for the config
  // itself - loadEnv reads them so VITE_API_PROXY works as documented.
  const env = loadEnv(mode, import.meta.dirname, "");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.resolve(import.meta.dirname, "src") },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY ?? "http://localhost:4000",
          changeOrigin: true,
        },
      },
    },
  };
});
