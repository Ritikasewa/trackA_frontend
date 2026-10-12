/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Dev proxy: /api/* -> FastAPI backend (no CORS changes needed). Override target with BACKEND_URL.
const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": { target: backend, changeOrigin: false, rewrite: (p) => p.replace(/^\/api/, "") } } },
  preview: { port: 4173, proxy: { "/api": { target: backend, changeOrigin: false, rewrite: (p) => p.replace(/^\/api/, "") } } },
  test: { globals: true, environment: "jsdom", setupFiles: ["./tests/setup.ts"], include: ["tests/**/*.test.{ts,tsx}"], css: false, testTimeout: 20000 },
});
