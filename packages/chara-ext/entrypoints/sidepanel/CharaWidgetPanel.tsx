import { ThemeProvider } from "styled-components";
import { ChatInterface, theme } from "@chara-codes/design-system";
import {
  UIStoreProvider,
  useUIStore,
  TrpcProvider,
  TechStacksProvider,
  Toaster,
} from "@chara-codes/core";

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
              <ChatInterface />
              <Toaster />
            </ThemeProvider>
          </UIStoreProvider>
        </TechStacksProvider>
      </TrpcProvider>
    </>
  );
};
