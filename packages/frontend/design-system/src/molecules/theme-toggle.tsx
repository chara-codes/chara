"use client";

import { useThemeStore } from "@chara-codes/core";
import styled from "styled-components";
import type { Theme } from "@/theme";

interface ThemeToggleProps {
  variant?: "switch" | "icon";
  showLabel?: boolean;
  className?: string;
}

// Styled components
const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => (props.theme as Theme).spacing.sm};
`;

const ToggleLabel = styled.span`
  font-size: ${(props) => (props.theme as Theme).typography.fontSize.sm};
  color: ${(props) => (props.theme as Theme).colors.textSecondary};
  user-select: none;
`;

const SwitchButton = styled.button<{ $isActive: boolean }>`
  position: relative;
  width: 44px;
  height: 24px;
  background-color: ${(props) => {
    const theme = props.theme as Theme;
    return props.$isActive ? theme.colors.primary : theme.colors.border;
  }};
  border: none;
  border-radius: ${(props) => (props.theme as Theme).borderRadius.full};
  cursor: pointer;
  transition: background-color ${(props) => (props.theme as Theme).transitions.theme};
  padding: 0;
  outline: none;

  &:hover {
    background-color: ${(props) => {
      const theme = props.theme as Theme;
      return props.$isActive ? theme.colors.primaryHover : theme.colors.borderHover;
    }};
  }

  &:focus-visible {
    box-shadow: ${(props) => (props.theme as Theme).shadows.focus}
      ${(props) => (props.theme as Theme).colors.primary};
  }
`;

const SwitchThumb = styled.div<{ $isActive: boolean }>`
  position: absolute;
  top: 2px;
  left: ${(props) => (props.$isActive ? "22px" : "2px")};
  width: 20px;
  height: 20px;
  background-color: ${(props) => (props.theme as Theme).colors.background};
  border-radius: 50%;
  transition: left ${(props) => (props.theme as Theme).transitions.theme};
  box-shadow: ${(props) => (props.theme as Theme).shadows.sm};
`;

const IconButton = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: ${(props) => (props.theme as Theme).colors.backgroundSecondary};
  border: 1px solid ${(props) => (props.theme as Theme).colors.border};
  border-radius: ${(props) => (props.theme as Theme).borderRadius.md};
  cursor: pointer;
  transition: all ${(props) => (props.theme as Theme).transitions.theme};
  padding: 0;
  outline: none;

  &:hover {
    background-color: ${(props) => (props.theme as Theme).colors.highlight};
    border-color: ${(props) => (props.theme as Theme).colors.borderHover};
  }

  &:focus-visible {
    box-shadow: ${(props) => (props.theme as Theme).shadows.focus}
      ${(props) => (props.theme as Theme).colors.primary};
  }

  svg {
    width: 20px;
    height: 20px;
    color: ${(props) => (props.theme as Theme).colors.text};
    transition: color ${(props) => (props.theme as Theme).transitions.theme};
  }
`;

// Sun icon for light theme
const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// Moon icon for dark theme
const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export function ThemeToggle({
  variant = "switch",
  showLabel = false,
  className = "",
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  const handleToggle = () => {
    toggleTheme();
  };

  if (variant === "icon") {
    return (
      <ToggleContainer className={className}>
        <IconButton
          type="button"
          onClick={handleToggle}
          $isActive={isDark}
          aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
          aria-pressed={isDark}
          title={`Switch to ${isDark ? "light" : "dark"} theme`}
        >
          {isDark ? <MoonIcon /> : <SunIcon />}
        </IconButton>
        {showLabel && (
          <ToggleLabel>{isDark ? "Dark" : "Light"} Theme</ToggleLabel>
        )}
      </ToggleContainer>
    );
  }

  return (
    <ToggleContainer className={className}>
      {showLabel && (
        <ToggleLabel>{isDark ? "Dark" : "Light"} Theme</ToggleLabel>
      )}
      <SwitchButton
        type="button"
        onClick={handleToggle}
        $isActive={isDark}
        role="switch"
        aria-checked={isDark}
        aria-label={`Toggle theme. Current theme: ${theme}`}
        title={`Switch to ${isDark ? "light" : "dark"} theme`}
      >
        <SwitchThumb $isActive={isDark} />
      </SwitchButton>
    </ToggleContainer>
  );
}

export default ThemeToggle;
