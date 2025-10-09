import {
  TechStacksProvider,
  Toaster,
  TrpcProvider,
  UIStoreProvider,
  useUIStore,
} from "@chara-codes/core";
import { ChatInterface, AppThemeProvider } from "@chara-codes/design-system";
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
              <AppThemeProvider>
                <ChatInterface />
                <Toaster />
              </AppThemeProvider>
            </UIStoreProvider>
          </TechStacksProvider>
        </TrpcProvider>
      </BrowserProvider>
    </>
  );
};
