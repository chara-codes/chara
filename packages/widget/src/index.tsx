import { ThemeProvider } from "styled-components";
import { ChatOverlayPanel, theme } from "@chara/design-system";
import {
  UIStoreProvider,
  useUIStore,
  TrpcProvider,
  TechStacksProvider,
} from "@chara/core";
import type React from "react";

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
      <TrpcProvider>
        <TechStacksProvider>
          <UIStoreProvider>
            <ThemeProvider theme={theme}>
              <ChatOverlayPanel
                defaultOpen={config?.defaultOpen}
                position={config?.position || "right"}
              />
            </ThemeProvider>
          </UIStoreProvider>
        </TechStacksProvider>
      </TrpcProvider>
    </>
  );
};
