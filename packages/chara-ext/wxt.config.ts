import { defineConfig } from "wxt";
import { resolve } from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@chara-codes/design-system": resolve(
          __dirname,
          "../frontend/design-system/src"
        ),
        "@chara-codes/core": resolve(__dirname, "../frontend/core/src"),
        // Add alias for design-system internal paths
        "@/theme": resolve(__dirname, "../frontend/design-system/src/theme"),
      },
    },
  }),
  manifest: {
    permissions: ["activeTab", "scripting", "sidePanel"],
    action: {
      default_title: "Open Chara Extension",
    },
    side_panel: {
      default_path: "sidepanel/index.html",
    },
    web_accessible_resources: [
      {
        resources: ["sidepanel/*"],
        matches: ["<all_urls>"],
      },
    ],
  },
});
