"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Theme } from "../types";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        theme: "system" as Theme,
        
        setTheme: (theme) => set({ theme }),
      }),
      {
        name: "theme-storage",
      }
    )
  )
);
