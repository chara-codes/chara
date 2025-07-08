import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/// <reference types="vitest" />

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 1235,
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
      "@apk/design-system": path.resolve(
        __dirname,
        "../frontend/design-system/src",
      ),
      "@apk/core": path.resolve(__dirname, "../frontend/core/src"),
      // Add alias for design-system internal paths
      "@/theme": path.resolve(__dirname, "../frontend/design-system/src/theme"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "main.js",
        assetFileNames: "main.css",
      },
    },
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
