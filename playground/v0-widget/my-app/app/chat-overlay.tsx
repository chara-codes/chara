"use client"

import { ThemeProvider } from "styled-components"
import { UIStoreProvider } from "../src/store/ui-store"
import ChatOverlayPanel from "../src/components/templates/chat-overlay-panel"
import GlobalStyles from "../src/styles/global-styles"
import { theme } from "../src/styles/theme"

// Configuration for the chat overlay panel
const chatConfig = {
  defaultOpen: false,
  position: "right" as const,
  offset: {
    bottom: 20,
    right: 20,
  },
}

export default function ChatOverlay() {
  return (
    <UIStoreProvider>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <ChatOverlayPanel
          defaultOpen={chatConfig.defaultOpen}
          position={chatConfig.position}
          offset={chatConfig.offset}
        />
      </ThemeProvider>
    </UIStoreProvider>
  )
}
