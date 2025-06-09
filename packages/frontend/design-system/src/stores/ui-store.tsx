"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type React from "react";
import { createContext, useContext, useRef, type ReactNode } from "react";
import type { ButtonConfig } from '@frontend/core';
import {
  PlusIcon,
  ClipIcon,
  PointerIcon,
} from "../atoms";

// Define min and max width constraints
export const PANEL_WIDTH_CONSTRAINTS = {
  MIN: 370,
  MAX: 800,
  DEFAULT: 420,
};

// Define keyboard shortcut settings
export interface KeyboardShortcut {
  key: string;
  description: string;
  enabled: boolean;
  action: string;
}

interface UIState {
  // Chat overlay visibility
  isChatOverlayOpen: boolean;
  // Chat overlay width
  chatOverlayWidth: number;
  // Keyboard shortcuts
  keyboardShortcuts: KeyboardShortcut[];
  // Visual feedback for shortcut activation
  showShortcutFeedback: boolean;
  // Input button configuration
  inputButtonConfig: ButtonConfig[];

  // Actions
  toggleChatOverlay: () => void;
  openChatOverlay: () => void;
  closeChatOverlay: () => void;
  setChatOverlayWidth: (width: number) => void;
  resetChatOverlayWidth: () => void;

  // Keyboard shortcut actions
  updateKeyboardShortcut: (
    action: string,
    updates: Partial<KeyboardShortcut>,
  ) => void;
  triggerShortcutFeedback: () => void;

  // Input button actions
  enableInputButton: (id: string) => void;
  disableInputButton: (id: string) => void;
  toggleInputButton: (id: string) => void;
  updateInputButtonConfig: (id: string, updates: Partial<ButtonConfig>) => void;
  disableAllInputButtons: () => void;
  enableAllInputButtons: () => void;

  // Shortcut handling
  handleKeyboardShortcut: (key: string) => boolean;
}

// Default keyboard shortcuts
const defaultKeyboardShortcuts: KeyboardShortcut[] = [
  {
    key: "±",
    description: "Toggle chat overlay panel",
    enabled: true,
    action: "toggleChatOverlay",
  },
];

// Default input button configuration
const defaultInputButtonConfig: ButtonConfig[] = [
  { id: "add-context", icon: PlusIcon, tooltip: "Add context", enabled: true },
  {
    id: "select-element",
    icon: PointerIcon,
    tooltip: "Select element",
    enabled: true,
  },
  { id: "upload-file", icon: ClipIcon, tooltip: "Upload file", enabled: true },
];

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isChatOverlayOpen: false,
        chatOverlayWidth: PANEL_WIDTH_CONSTRAINTS.DEFAULT,
        keyboardShortcuts: defaultKeyboardShortcuts,
        showShortcutFeedback: false,
        inputButtonConfig: defaultInputButtonConfig,

        // Actions
        toggleChatOverlay: () =>
          set((state) => ({ isChatOverlayOpen: !state.isChatOverlayOpen })),
        openChatOverlay: () => set({ isChatOverlayOpen: true }),
        closeChatOverlay: () => set({ isChatOverlayOpen: false }),
        setChatOverlayWidth: (width: number) => {
          // Ensure width is within constraints
          const constrainedWidth = Math.max(
            PANEL_WIDTH_CONSTRAINTS.MIN,
            Math.min(width, PANEL_WIDTH_CONSTRAINTS.MAX),
          );
          set({ chatOverlayWidth: constrainedWidth });
        },
        resetChatOverlayWidth: () =>
          set({ chatOverlayWidth: PANEL_WIDTH_CONSTRAINTS.DEFAULT }),

        // Keyboard shortcut actions
        updateKeyboardShortcut: (
          action: string,
          updates: Partial<KeyboardShortcut>,
        ) => {
          set((state) => ({
            keyboardShortcuts: state.keyboardShortcuts.map((shortcut) =>
              shortcut.action === action
                ? { ...shortcut, ...updates }
                : shortcut,
            ),
          }));
        },

        triggerShortcutFeedback: () => {
          set({ showShortcutFeedback: true });
          setTimeout(() => set({ showShortcutFeedback: false }), 500);
        },

        // Input button actions
        enableInputButton: (id: string) => {
          set((state) => ({
            inputButtonConfig: state.inputButtonConfig.map((button) =>
              button.id === id ? { ...button, enabled: true } : button,
            ),
          }));
        },

        disableInputButton: (id: string) => {
          set((state) => ({
            inputButtonConfig: state.inputButtonConfig.map((button) =>
              button.id === id ? { ...button, enabled: false } : button,
            ),
          }));
        },

        toggleInputButton: (id: string) => {
          set((state) => ({
            inputButtonConfig: state.inputButtonConfig.map((button) =>
              button.id === id
                ? { ...button, enabled: !button.enabled }
                : button,
            ),
          }));
        },

        updateInputButtonConfig: (
          id: string,
          updates: Partial<ButtonConfig>,
        ) => {
          set((state) => ({
            inputButtonConfig: state.inputButtonConfig.map((button) =>
              button.id === id ? { ...button, ...updates } : button,
            ),
          }));
        },

        disableAllInputButtons: () => {
          set((state) => ({
            inputButtonConfig: state.inputButtonConfig.map((button) => ({
              ...button,
              enabled: false,
            })),
          }));
        },

        enableAllInputButtons: () => {
          set((state) => ({
            inputButtonConfig: state.inputButtonConfig.map((button) => ({
              ...button,
              enabled: true,
            })),
          }));
        },

        // Handle keyboard shortcuts
        handleKeyboardShortcut: (key: string) => {
          const { keyboardShortcuts } = get();
          const matchingShortcut = keyboardShortcuts.find(
            (shortcut) => shortcut.key === key && shortcut.enabled,
          );

          if (!matchingShortcut) return false;

          // Trigger visual feedback
          get().triggerShortcutFeedback();

          // Execute the corresponding action
          switch (matchingShortcut.action) {
            case "toggleChatOverlay":
              get().toggleChatOverlay();
              return true;

            case "closeOrNavigateBack":
              if (get().isChatOverlayOpen) {
                get().closeChatOverlay();
                return true;
              }
              return false; // Let the routing store handle navigation back

            case "focusSearch":
              // This will be handled by the component that renders the search input
              return true;

            default:
              return false;
          }
        },
      }),
      {
        name: "ai-chat-ui-storage",
        partialize: (state) => ({
          isChatOverlayOpen: state.isChatOverlayOpen,
          chatOverlayWidth: state.chatOverlayWidth,
          keyboardShortcuts: state.keyboardShortcuts,
          inputButtonConfig: state.inputButtonConfig,
        }),
      },
    ),
  ),
);

// Create a context for the UI store
type UIStoreContextValue = {
  store: typeof useUIStore;
};

export const UIStoreContext = createContext<UIStoreContextValue | null>(null);

// Create a provider component
interface UIStoreProviderProps {
  children: ReactNode;
}

export const UIStoreProvider: React.FC<UIStoreProviderProps> = ({
  children,
}) => {
  const storeRef = useRef(useUIStore);
  return (
    <UIStoreContext.Provider value={{ store: storeRef.current }}>
      {children}
    </UIStoreContext.Provider>
  );
};

// Hook to use the UI store context
export const useUIStoreContext = () => {
  const context = useContext(UIStoreContext);
  if (!context) {
    throw new Error("useUIStoreContext must be used within a UIStoreProvider");
  }
  return context.store;
};
