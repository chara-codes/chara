"use client"

import { ThemeProvider } from "styled-components"
import { UIStoreProvider } from "../src/store/ui-store"
import ChatOverlayPanel from "../src/components/templates/chat-overlay-panel"
import GlobalStyles from "../src/styles/global-styles"
import { theme } from "../src/styles/theme"
import { useEffect, useState } from "react"
import Link from "next/link"
import styled from "styled-components"

// Configuration for the chat overlay panel
const chatConfig = {
  defaultOpen: false, // Start closed to better see the page content
  position: "right" as const,
  offset: {
    bottom: 20,
    right: 20,
  },
}

// Styled components for the workspace link - using inline styles instead of theme
const WorkspaceLinkContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`

const WorkspaceButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  background-color: #0070f3;
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #0060df;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
`

const WorkspaceDescription = styled.p`
  font-size: 16px;
  color: #333333;
  text-align: center;
  max-width: 400px;
`

export default function HomePage() {
  // Use state to handle client-side rendering
  const [isMounted, setIsMounted] = useState(false)
  const [darkMode] = useState(false)
  const [, setScrollPosition] = useState(0)

  // Only render the chat panel on the client side
  useEffect(() => {
    setIsMounted(true)

    const handleScroll = () => {
      setScrollPosition(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="bg-background text-foreground relative">
        {/* Workspace Link */}
        {isMounted && (
          <WorkspaceLinkContainer>
            <WorkspaceDescription>
              Try our new workspace interface with resizable panels and multiple preview options
            </WorkspaceDescription>
            <Link href="/workspace" passHref legacyBehavior>
              <WorkspaceButton>Open Workspace</WorkspaceButton>
            </Link>
          </WorkspaceLinkContainer>
        )}

        {/* Chat Overlay Panel */}
        {isMounted && (
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
        )}
      </div>
    </div>
  )
}
