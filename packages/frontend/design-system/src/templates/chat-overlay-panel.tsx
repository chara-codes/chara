"use client";

import {
  useRunnerConnect,
  useRunnerConnection,
  useUIStore,
} from "@chara-codes/core";
import React, { useCallback, useEffect } from "react";
import styled from "styled-components";
import { ChatIcon } from "../atoms/icons";
import ResizeHandle from "../atoms/resize-handle";
import { ChatInterface } from "../templates";
import { theme } from "../theme/theme";

const Backdrop = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  justify-content: flex-end;
  visibility: ${({ isOpen }) => (isOpen ? "visible" : "hidden")};
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transition: visibility 0s ${({ isOpen }) => (isOpen ? "0s" : "0.3s")},
    opacity 0.3s linear;

  @media (min-width: 769px) {
    background-color: transparent;
    pointer-events: ${({ isOpen }) => (isOpen ? "auto" : "none")};
  }
`;

const OverlayContainer = styled.div<{
  isOpen: boolean;
  width: number;
  $isResizing: boolean;
  position: "right" | "left";
  $showFeedback: boolean;
}>`
  background-color: ${theme.colors.background};
  width: ${({ width }) => `${width}px`};
  max-width: 90%;
  height: 100%;
  box-shadow: ${({ position }) =>
    position === "right"
      ? "-2px 0 10px rgba(0, 0, 0, 0.1)"
      : "2px 0 10px rgba(0, 0, 0, 0.1)"};
  z-index: 1000;
  transform: translateX(
    ${({ isOpen, position }) =>
      isOpen ? "0" : position === "right" ? "100%" : "-100%"}
  );
  transition: ${({ $isResizing }) =>
    $isResizing ? "none" : "transform 0.3s ease-in-out"};
  position: relative;
  border-left: ${({ position }) =>
    position === "right" ? `1px solid ${theme.colors.border}` : "none"};
  border-right: ${({ position }) =>
    position === "left" ? `1px solid ${theme.colors.border}` : "none"};
  display: flex;
  flex-direction: column;
  overflow: hidden;

  ${({ $showFeedback }) =>
    $showFeedback &&
    `
    box-shadow: 0 0 0 2px ${theme.colors.primary}, -2px 0 10px rgba(0, 0, 0, 0.2);
  `}

  @media (max-width: 768px) {
    width: 90%;
  }
`;

const ToggleButton = styled.button<{
  position: "right" | "left";
  bottom?: number;
  right?: number;
  left?: number;
  $showFeedback: boolean;
}>`
  position: fixed;
  bottom: ${({ bottom }) => (bottom !== undefined ? `${bottom}px` : "20px")};
  right: ${({ position, right }) =>
    position === "right"
      ? right !== undefined
        ? `${right}px`
        : "20px"
      : "auto"};
  left: ${({ position, left }) =>
    position === "left" ? (left !== undefined ? `${left}px` : "20px") : "auto"};
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: ${theme.colors.primary};
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 998;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, background-color 0.2s ease,
    box-shadow 0.2s ease;

  ${({ $showFeedback }) =>
    $showFeedback &&
    `
    transform: scale(1.1);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5), 0 2px 10px rgba(0, 0, 0, 0.2);
  `}

  &:hover {
    background-color: ${theme.colors.primary}dd;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ChatInterfaceWrapper = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ShortcutTooltip = styled.div<{ isVisible: boolean }>`
  position: fixed;
  bottom: 80px;
  right: 20px;
  background-color: #1f2937;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transform: translateY(${({ isVisible }) => (isVisible ? 0 : "10px")});
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);

  &::after {
    content: "";
    position: absolute;
    bottom: -5px;
    right: 20px;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid #1f2937;
  }
`;

interface ChatOverlayPanelProps {
  defaultOpen?: boolean;
  position?: "right" | "left";
  offset?: {
    bottom?: number;
    right?: number;
    left?: number;
  };
}

export const ChatOverlayPanel: React.FC<ChatOverlayPanelProps> = ({
  defaultOpen = false,
  position = "right",
  offset = { bottom: 20, right: 20, left: 20 },
}) => {
  const [isResizing, setIsResizing] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const {
    isChatOverlayOpen,
    toggleChatOverlay,
    openChatOverlay,
    closeChatOverlay,
    chatOverlayWidth,
    setChatOverlayWidth,
    handleKeyboardShortcut,
    keyboardShortcuts,
    showShortcutFeedback,
  } = useUIStore(); // This call should now work correctly and return UIState

  const { isConnected, isConnecting } = useRunnerConnection();
  const connect = useRunnerConnect();

  // Connect to runner service on mount
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      connect().catch(console.error);
    }
  }, [isConnected, isConnecting]);

  useEffect(() => {
    if (defaultOpen) {
      openChatOverlay();
    }
  }, [defaultOpen, openChatOverlay]);

  useEffect(() => {
    if (isChatOverlayOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isChatOverlayOpen]);

  const handleResize = useCallback(
    (newWidth: number) => {
      setIsResizing(true);
      setChatOverlayWidth(newWidth);
      // @ts-expect-error - window.resizeTimeout is not in Window type definition
      if (window.resizeTimeout) {
        // @ts-expect-error - window.resizeTimeout is not in Window type definition
        clearTimeout(window.resizeTimeout);
      }
      // @ts-expect-error - window.resizeTimeout is not in Window type definition
      window.resizeTimeout = setTimeout(() => {
        setIsResizing(false);
      }, 100) as unknown as number;
    },
    [setChatOverlayWidth]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement &&
          document.activeElement.getAttribute("contenteditable") === "true")
      ) {
        return;
      }
      if (document.body.classList.contains("element-selecting")) {
        return;
      }
      if (
        document.getElementById("element-selector-cursor") ||
        document.getElementById("element-selection-guide") ||
        document.getElementById("element-tag-display") ||
        document.getElementById("element-comment-modal")
      ) {
        return;
      }
      const toggleShortcut = keyboardShortcuts.find(
        (shortcut) =>
          shortcut.action === "toggleChatOverlay" && shortcut.enabled
      );
      if (!toggleShortcut) return;
      if (event.key === toggleShortcut.key) {
        event.preventDefault();
        handleKeyboardShortcut(toggleShortcut.key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [keyboardShortcuts, handleKeyboardShortcut]);

  const handleMouseEnter = () => {
    const toggleShortcut = keyboardShortcuts.find(
      (shortcut) => shortcut.action === "toggleChatOverlay" && shortcut.enabled
    );
    if (toggleShortcut) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const getShortcutKey = () => {
    const toggleShortcut = keyboardShortcuts.find(
      (shortcut) => shortcut.action === "toggleChatOverlay" && shortcut.enabled
    );
    return toggleShortcut ? toggleShortcut.key : "±";
  };

  return (
    <>
      <Backdrop
        isOpen={isChatOverlayOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeChatOverlay();
          }
        }}
      >
        <OverlayContainer
          isOpen={isChatOverlayOpen}
          width={chatOverlayWidth}
          $isResizing={isResizing}
          position={position}
          $showFeedback={showShortcutFeedback}
          id="chat-overlay-panel"
        >
          <ResizeHandle
            onResize={handleResize}
            currentWidth={chatOverlayWidth}
            minWidth={300}
            maxWidth={800}
          />
          <ChatInterfaceWrapper>
            <ChatInterface />
          </ChatInterfaceWrapper>
        </OverlayContainer>
      </Backdrop>
      <ToggleButton
        onClick={toggleChatOverlay}
        aria-label={isChatOverlayOpen ? "Close chat panel" : "Open chat panel"}
        aria-expanded={isChatOverlayOpen}
        aria-controls="chat-overlay-panel"
        position={position}
        bottom={offset.bottom}
        right={offset.right}
        left={offset.left}
        $showFeedback={showShortcutFeedback}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <ChatIcon />
      </ToggleButton>
      <ShortcutTooltip isVisible={showTooltip}>
        Press {getShortcutKey()} to toggle chat panel
      </ShortcutTooltip>
    </>
  );
};
