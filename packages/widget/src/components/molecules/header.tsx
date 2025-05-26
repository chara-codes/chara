"use client";

import type React from "react";
import styled from "styled-components";
import { useCallback } from "react";
import {
  HistoryIcon,
  SettingsIcon,
  PlusIcon,
  LayersIcon, // Import the LayersIcon
} from "../atoms/icons";
import {
  useNavigateToHistory,
  useNavigateToSettings,
  useNavigateToNewThread,
  useNavigateToTechStacks, // Import the new navigation hook
  useCurrentScreen,
  Screen,
} from "../../store/routing-store";
import type { Theme } from "../../styles/theme";

interface HeaderProps {
  title?: string;
}

const HeaderContainer = styled.header`
  all: revert;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid ${({ theme }) => (theme as Theme).colors.border};
  background-color: ${({ theme }) => (theme as Theme).colors.background};
`;

const Title = styled.h1`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => (theme as Theme).colors.text};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HeaderButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  background-color: ${({ $active, theme }) =>
    $active ? (theme as Theme).colors.backgroundSecondary : "transparent"};
  color: ${({ $active, theme }) =>
    $active
      ? (theme as Theme).colors.primary
      : (theme as Theme).colors.textSecondary};
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    background-color: ${({ theme }) =>
      (theme as Theme).colors.backgroundSecondary};
    color: ${({ $active, theme }) =>
      $active ? (theme as Theme).colors.primary : (theme as Theme).colors.text};
  }
`;

const Header: React.FC<HeaderProps> = ({ title }) => {
  // Get navigation actions from routing store
  const navigateToHistory = useNavigateToHistory();
  const navigateToSettings = useNavigateToSettings();
  const navigateToNewThread = useNavigateToNewThread();
  const navigateToTechStacks = useNavigateToTechStacks(); // Get the new navigation action
  const currentScreen = useCurrentScreen();

  // Get title based on current screen
  const getScreenTitle = () => {
    switch (currentScreen) {
      case Screen.CONVERSATION:
      case Screen.NEW_THREAD:
        return "Thread";
      case Screen.HISTORY:
        return "History";
      case Screen.TECH_STACKS:
      case Screen.ADD_TECH_STACK:
      case Screen.EDIT_TECH_STACK:
        return "Stacks";
      case Screen.SETTINGS:
        return "Settings";
      default:
        return "Chat";
    }
  };

  // Memoize handlers to prevent unnecessary re-renders
  const handleHistoryClick = useCallback(() => {
    navigateToHistory();
  }, [navigateToHistory]);

  const handleSettingsClick = useCallback(() => {
    navigateToSettings();
  }, [navigateToSettings]);

  const handleNewThreadClick = useCallback(() => {
    navigateToNewThread();
  }, [navigateToNewThread]);

  const handleTechStacksClick = useCallback(() => {
    navigateToTechStacks();
  }, [navigateToTechStacks]);

  return (
    <HeaderContainer>
      <Title>{title || getScreenTitle()}</Title>
      <HeaderActions>
        <HeaderButton onClick={handleNewThreadClick} title="New Thread">
          <PlusIcon width={16} height={16} />
        </HeaderButton>
        <HeaderButton
          onClick={handleHistoryClick}
          title="History"
          $active={currentScreen === Screen.HISTORY}
        >
          <HistoryIcon size={16} />
        </HeaderButton>
        <HeaderButton
          onClick={handleTechStacksClick}
          title="Tech Stacks"
          $active={currentScreen === Screen.TECH_STACKS}
        >
          <LayersIcon width={16} height={16} />
        </HeaderButton>
        <HeaderButton
          onClick={handleSettingsClick}
          title="Settings"
          $active={currentScreen === Screen.SETTINGS}
        >
          <SettingsIcon size={16} />
        </HeaderButton>
      </HeaderActions>
    </HeaderContainer>
  );
};

export default Header;
