import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

interface ThemeState {
  // Current theme mode
  theme: "light" | "dark";

  // Actions
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
}

// Validate theme value
const isValidTheme = (value: unknown): value is "light" | "dark" => {
  return value === "light" || value === "dark";
};

// Safe localStorage wrapper with error handling
const createSafeStorage = () => {
  let isLocalStorageAvailable = true;

  // Test localStorage availability
  try {
    const testKey = "__theme_storage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
  } catch (error) {
    isLocalStorageAvailable = false;
    console.warn(
      "[Theme Store] localStorage is not available. Theme preference will not persist across sessions.",
      error
    );
  }

  return createJSONStorage(() => ({
    getItem: (name: string) => {
      if (!isLocalStorageAvailable) {
        return null;
      }

      try {
        const value = localStorage.getItem(name);
        if (value === null) {
          return null;
        }

        const parsed = JSON.parse(value);

        // Validate the theme value
        if (parsed?.state?.theme && !isValidTheme(parsed.state.theme)) {
          console.warn(
            `[Theme Store] Invalid theme value "${parsed.state.theme}" found in storage. Defaulting to "light".`
          );
          // Clear invalid value
          localStorage.removeItem(name);
          return null;
        }

        return value;
      } catch (error) {
        console.warn(
          `[Theme Store] Error reading from localStorage: ${error instanceof Error ? error.message : "Unknown error"}. Using default theme.`
        );
        // Clear corrupted value
        try {
          localStorage.removeItem(name);
        } catch {
          // Ignore errors when trying to clean up
        }
        return null;
      }
    },

    setItem: (name: string, value: string) => {
      if (!isLocalStorageAvailable) {
        return;
      }

      try {
        localStorage.setItem(name, value);
      } catch (error) {
        console.warn(
          `[Theme Store] Error writing to localStorage: ${error instanceof Error ? error.message : "Unknown error"}. Theme preference will not persist.`
        );
        // If this is a quota error, mark localStorage as unavailable
        if (error instanceof Error && error.name === "QuotaExceededError") {
          isLocalStorageAvailable = false;
        }
      }
    },

    removeItem: (name: string) => {
      if (!isLocalStorageAvailable) {
        return;
      }

      try {
        localStorage.removeItem(name);
      } catch (error) {
        console.warn(
          `[Theme Store] Error removing from localStorage: ${error instanceof Error ? error.message : "Unknown error"}.`
        );
      }
    },
  }));
};

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state - defaults to light theme
        theme: "light",

        // Actions
        setTheme: (theme: "light" | "dark") => {
          // Validate theme value before setting
          if (!isValidTheme(theme)) {
            console.warn(
              `[Theme Store] Attempted to set invalid theme "${theme}". Ignoring.`
            );
            return;
          }
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
        storage: createSafeStorage(),
      }
    ),
    {
      name: "Theme Store",
    }
  )
);
