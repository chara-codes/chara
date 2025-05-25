import { ThemeProvider } from "styled-components";
import ChatOverlayPanel from "./components/templates/chat-overlay-panel";
import { UIStoreProvider } from "./store/ui-store";
import { theme } from "./styles/theme";

// Configuration interface
export interface CharaWidgetConfig {
  defaultOpen?: boolean;
  position?: "right" | "left";
}

export const CharaWidgetPanel = (config: CharaWidgetConfig) => {
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
