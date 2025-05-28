"use client";

import { ThemeProvider } from "styled-components";
import { UIStoreProvider } from "../src/store/ui-store";
import ChatOverlayPanel from "../src/components/templates/chat-overlay-panel";
import { theme } from "../src/styles/theme";
import { useEffect, useState } from "react";

// Configuration for the chat overlay panel
const chatConfig = {
  defaultOpen: false, // Start closed to better see the page content
  position: "right" as const,
  offset: {
    bottom: 20,
    right: 20,
  },
};

export default function HomePage() {
  // Use state to handle client-side rendering
  const [isMounted, setIsMounted] = useState(false);
  const [darkMode] = useState(false);
  const [, setScrollPosition] = useState(0);

  // Only render the chat panel on the client side
  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="bg-background text-foreground relative">
        {/* Chat Overlay Panel */}
        {isMounted && (
          <UIStoreProvider>
            <ThemeProvider theme={theme}>
              <ChatOverlayPanel
                defaultOpen={chatConfig.defaultOpen}
                position={chatConfig.position}
                offset={chatConfig.offset}
              />
            </ThemeProvider>
          </UIStoreProvider>
        )}
      </div>
    </div>
  );
}
