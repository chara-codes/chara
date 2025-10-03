"use client";

import React, { ReactNode } from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { useThemeStore } from "@chara-codes/core/stores/theme-store";
import { lightTheme, darkTheme } from "./theme";

interface AppThemeProviderProps {
  children: ReactNode;
}

export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  // Subscribe to theme store
  const currentTheme = useThemeStore((state) => state.theme);

  // Select appropriate theme object based on store state
  const themeObject = currentTheme === "dark" ? darkTheme : lightTheme;

  return (
    <StyledThemeProvider theme={themeObject}>
      {children}
    </StyledThemeProvider>
  );
};
