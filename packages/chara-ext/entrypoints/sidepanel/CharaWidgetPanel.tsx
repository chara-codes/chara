import {
  TechStacksProvider,
  Toaster,
  TrpcProvider,
  UIStoreProvider,
  useUIStore,
} from "@chara-codes/core";
import { ChatInterface, theme } from "@chara-codes/design-system";
import { ThemeProvider } from "styled-components";
import { BrowserProvider } from "./BrowserProvider";

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
  }

  return (
    <>
      <BrowserProvider>
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
      </BrowserProvider>
    </>
  );
};
