"use client";

import type React from "react";
import styled from "styled-components";
import IconButton from "../atoms/icon-button";
import Tooltip from "../atoms/tooltip";
import { useRoutingStore, Screen } from "../../store/routing-store";

interface HeaderProps {
  title?: string;
}

// Update the header styles to be more compact
const HeaderContainer = styled.header`
  all: revert;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #fff;
`;

const Title = styled.h1`
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: -4px;
`;

const SettingsButtonWrapper = styled.div`
  margin-right: 8px;
  position: relative;

  @media (min-width: 768px) {
    margin-right: 12px;
  }
`;

const RoundedIconButton = styled(IconButton)`
  border-radius: 8px;
  overflow: hidden;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

const PlusIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 5V19"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 12H19"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DotsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HistoryIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 8V12L15 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.05 11C3.27 8.18 4.71 5.62 6.97 3.94C9.24 2.26 12.1 1.65 14.83 2.26C17.56 2.86 19.89 4.62 21.24 7.05C22.59 9.48 22.83 12.36 21.89 14.97C20.95 17.58 18.93 19.63 16.32 20.63C13.71 21.63 10.82 21.47 8.34 20.18C5.86 18.9 4.02 16.61 3.33 13.88C3.11 12.95 3 11.98 3 11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Helper function to get dynamic title based on current screen
const getScreenTitle = (screen: Screen): string => {
  switch (screen) {
    case Screen.CONVERSATION:
      return "New Thread";
    case Screen.HISTORY:
      return "Chat History";
    case Screen.SETTINGS:
      return "Settings";
    case Screen.NEW_THREAD:
      return "New Thread";
    default:
      return "AI Chat";
  }
};

const Header: React.FC<HeaderProps> = ({ title }) => {
  const currentScreen = useRoutingStore((state) => state.currentScreen);
  const {
    navigateToNewThread,
    navigateToHistory,
    navigateToSettings,
    navigateToConversation,
  } = useRoutingStore();

  // Use provided title or generate one based on current screen
  const displayTitle = title || getScreenTitle(currentScreen);

  const handleNewThread = () => {
    // If we're in history view, first navigate back to conversation, then create new thread
    if (currentScreen === Screen.HISTORY) {
      navigateToConversation();
    }
    navigateToNewThread();
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <Title>{displayTitle}</Title>
      </LeftSection>
      <RightSection>
        <Tooltip text="New Chat" position="bottom" delay={500}>
          <RoundedIconButton onClick={handleNewThread} aria-label="New Chat">
            <PlusIcon />
          </RoundedIconButton>
        </Tooltip>

        <Tooltip text="Chat History" position="bottom" delay={500}>
          <RoundedIconButton
            onClick={navigateToHistory}
            aria-label="Chat History"
          >
            <HistoryIcon />
          </RoundedIconButton>
        </Tooltip>

        <SettingsButtonWrapper>
          <Tooltip text="Settings" position="bottom" delay={500}>
            <RoundedIconButton
              onClick={navigateToSettings}
              aria-label="Settings"
            >
              <DotsIcon />
            </RoundedIconButton>
          </Tooltip>
        </SettingsButtonWrapper>
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;
