import { resolve } from "path";
import { defineConfig } from "wxt";

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
        react: resolve(__dirname, "node_modules/react"),
        "react-dom": resolve(__dirname, "node_modules/react-dom"),
      },
    },
  }),
  manifest: {
    permissions: ["activeTab", "sidePanel", "tabs"],
    action: {
      default_title: "Click to Chara Codes side panel",
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
