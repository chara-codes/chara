import { ThemeProvider } from "styled-components";
import ChatOverlayPanel from "./components/templates/chat-overlay-panel";
import { UIStoreProvider, useUIStore } from "./store/ui-store";
import { theme } from "./styles/theme";

// Configuration interface
export interface CharaWidgetConfig {
  defaultOpen?: boolean;
  position?: "right" | "left";
  enabledInputButtons?: string;
}

export const CharaWidgetPanel = (config: CharaWidgetConfig) => {
  const { enabledInputButtons } = config;
  const { disableAllInputButtons } = useUIStore();

  if (enabledInputButtons?.length && enabledInputButtons?.split(",").length) {
    disableAllInputButtons();
    // for (const button of enabledInputButtons.split(",")) {
    //   enableInputButton(button);
    // }
  }

  return (
    <>
      <UIStoreProvider>
        <ThemeProvider theme={theme}>
          <ChatOverlayPanel
            defaultOpen={config?.defaultOpen}
            position={config?.position || "right"}
          />
        </ThemeProvider>
      </UIStoreProvider>
    </>
  );
};
