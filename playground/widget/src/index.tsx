import { createRoot } from "react-dom/client";
import { ThemeProvider } from "styled-components";
import ChatOverlayPanel from "./components/templates/chat-overlay-panel";
import { UIStoreProvider } from "./store/ui-store";
import GlobalStyles from "./styles/global-styles";
import { theme } from "./styles/theme";

// Configuration interface
interface ChatWidgetConfig {
  useShadowDOM?: boolean;
  containerId?: string;
  defaultOpen?: boolean;
  position?: "right" | "left";
  offset?: {
    bottom?: number;
    right?: number;
    left?: number;
  };
}

// Default configuration
const defaultConfig: ChatWidgetConfig = {
  useShadowDOM: false,
  containerId: "ai-chat-widget",
  defaultOpen: false,
  position: "right",
  offset: {
    bottom: 20,
    right: 20,
  },
};

const App = ({ config }: { config: ChatWidgetConfig }) => {
  return (
    <>
      <UIStoreProvider>
        <ThemeProvider theme={theme}>
          <GlobalStyles />
          <ChatOverlayPanel
            defaultOpen={config.defaultOpen}
            position={config.position}
            offset={config.offset}
          />
        </ThemeProvider>
      </UIStoreProvider>
    </>
  );
};

// For direct React integration
const renderApp = (containerId = "root", config = defaultConfig) => {
  const container = document.getElementById(containerId);
  if (container) {
    const root = createRoot(container);
    root.render(<App config={config} />);
  }
};

// For script tag usage
class ChatWidgetLoader {
  private config: ChatWidgetConfig = { ...defaultConfig };

  // Configure the widget
  configure(config: Partial<ChatWidgetConfig> = {}) {
    this.config = { ...this.config, ...config };
    return this;
  }

  // Initialize with Shadow DOM
  private initWithShadowDOM(containerId: string) {
    let container = document.getElementById(containerId);

    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      document.body.appendChild(container);
    }

    // Create shadow root
    const shadowRoot = container.attachShadow({ mode: "open" });

    // Create container inside shadow root
    const shadowContainer = document.createElement("div");
    shadowContainer.id = "shadow-container";
    shadowRoot.appendChild(shadowContainer);

    // Create root and render
    const root = createRoot(shadowContainer);
    root.render(<App config={this.config} />);
  }

  // Initialize without Shadow DOM
  private initWithoutShadowDOM(containerId: string) {
    let container = document.getElementById(containerId);

    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      document.body.appendChild(container);
    }

    const root = createRoot(container);
    root.render(<App config={this.config} />);
  }

  // Initialize the widget
  init(config: Partial<ChatWidgetConfig> = {}) {
    // Apply any config passed to init
    this.configure(config);

    const { useShadowDOM, containerId } = this.config;

    if (useShadowDOM) {
      this.initWithShadowDOM(containerId!);
    } else {
      this.initWithoutShadowDOM(containerId!);
    }

    return this;
  }
}

// Create singleton instance
const chatWidget = new ChatWidgetLoader();

// Expose to window for global access
if (typeof window !== "undefined") {
  (window as Window & { AIChatWidget?: ChatWidgetLoader }).AIChatWidget =
    chatWidget;
}

// Auto-initialize if in a React environment
if (document.getElementById("root")) {
  renderApp();
}

// Export components and configuration for direct usage
export { ChatOverlayPanel, UIStoreProvider, GlobalStyles, theme };
export type { ChatWidgetConfig };
export default chatWidget;
