import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/// <reference types="vitest" />

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 1237,
  },
  plugins: [
    react({
      jsxImportSource: "react",
      jsxRuntime: "automatic",
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@chara-codes/design-system": path.resolve(
        __dirname,
        "../frontend/design-system/src"
      ),
      "@chara-codes/core": path.resolve(__dirname, "../frontend/core/src"),
      // Add alias for design-system internal paths
      "@/theme": path.resolve(__dirname, "../frontend/design-system/src/theme"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
