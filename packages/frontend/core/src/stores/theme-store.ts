import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface ThemeState {
  // Current theme mode
  theme: "light" | "dark";

  // Actions
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        theme: "light",

        // Actions
        setTheme: (theme: "light" | "dark") => {
          set({ theme });
        },

        toggleTheme: () => {
          set((state) => ({
            theme: state.theme === "light" ? "dark" : "light",
          }));
        },
      }),
      {
        name: "app-theme-storage",
      }
    ),
    {
      name: "Theme Store",
    }
  )
);
