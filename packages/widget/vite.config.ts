import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    port: 3000,
    allowedHosts: ["widget.chara-ai.dev"],
  },
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: "main.js",
        assetFileNames: "main.css",
      },
    },
  },
});
