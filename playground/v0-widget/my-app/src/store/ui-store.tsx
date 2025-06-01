"use client";

import { create, type StoreApi, useStore } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type React from "react";
import { createContext, useContext, useRef, type ReactNode } from "react";
import type { ButtonConfig } from "../types/input-area";
import {
  PlusIcon,
  ClipIcon,
  PointerIcon,
} from "../components/atoms/input-icons";

export const PANEL_WIDTH_CONSTRAINTS = {
  MIN: 370,
  MAX: 800,
  DEFAULT: 420,
};

export interface KeyboardShortcut {
  key: string;
  description: string;
  enabled: boolean;
  action: string;
}

export interface UIState {
  isChatOverlayOpen: boolean;
  chatOverlayWidth: number;
  keyboardShortcuts: KeyboardShortcut[];
  showShortcutFeedback: boolean;
  inputButtonConfig: ButtonConfig[];
  toggleChatOverlay: () => void;
  openChatOverlay: () => void;
  closeChatOverlay: () => void;
  setChatOverlayWidth: (width: number) => void;
  resetChatOverlayWidth: () => void;
  updateKeyboardShortcut: (
    action: string,
    updates: Partial<KeyboardShortcut>,
  ) => void;
  triggerShortcutFeedback: () => void;
  enableInputButton: (id: string) => void;
  disableInputButton: (id: string) => void;
  toggleInputButton: (id: string) => void;
  updateInputButtonConfig: (id: string, updates: Partial<ButtonConfig>) => void;
  disableAllInputButtons: () => void;
  enableAllInputButtons: () => void;
  handleKeyboardShortcut: (key: string) => boolean;
}

const defaultKeyboardShortcuts: KeyboardShortcut[] = [
  {
    key: "±",
    description: "Toggle chat overlay panel",
    enabled: true,
    action: "toggleChatOverlay",
  },
];

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

export const createUIStoreInstance = () =>
  create<UIState>()(
    devtools(
      persist(
        (set, get) => ({
          isChatOverlayOpen: false,
          chatOverlayWidth: PANEL_WIDTH_CONSTRAINTS.DEFAULT,
          keyboardShortcuts: defaultKeyboardShortcuts,
          showShortcutFeedback: false,
          inputButtonConfig: defaultInputButtonConfig,
          toggleChatOverlay: () =>
            set((state) => ({ isChatOverlayOpen: !state.isChatOverlayOpen })),
          openChatOverlay: () => set({ isChatOverlayOpen: true }),
          closeChatOverlay: () => set({ isChatOverlayOpen: false }),
          setChatOverlayWidth: (width: number) => {
            const constrainedWidth = Math.max(
              PANEL_WIDTH_CONSTRAINTS.MIN,
              Math.min(width, PANEL_WIDTH_CONSTRAINTS.MAX),
            );
            set({ chatOverlayWidth: constrainedWidth });
          },
          resetChatOverlayWidth: () =>
            set({ chatOverlayWidth: PANEL_WIDTH_CONSTRAINTS.DEFAULT }),
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
          handleKeyboardShortcut: (key: string) => {
            const {
              keyboardShortcuts,
              isChatOverlayOpen,
              toggleChatOverlay,
              closeChatOverlay,
              triggerShortcutFeedback: triggerFeedback,
            } = get();
            const matchingShortcut = keyboardShortcuts.find(
              (shortcut) => shortcut.key === key && shortcut.enabled,
            );
            if (!matchingShortcut) return false;
            triggerFeedback();
            switch (matchingShortcut.action) {
              case "toggleChatOverlay":
                toggleChatOverlay();
                return true;
              case "closeOrNavigateBack":
                if (isChatOverlayOpen) {
                  closeChatOverlay();
                  return true;
                }
                return false;
              case "focusSearch":
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

export type UIStoreApi = StoreApi<UIState>;
export const UIStoreContext = createContext<UIStoreApi | undefined>(undefined);

interface UIStoreProviderProps {
  children: ReactNode;
}

export const UIStoreProvider: React.FC<UIStoreProviderProps> = ({
  children,
}) => {
  const storeRef = useRef<UIStoreApi>();
  if (!storeRef.current) {
    storeRef.current = createUIStoreInstance();
  }
  return (
    <UIStoreContext.Provider value={storeRef.current}>
      {children}
    </UIStoreContext.Provider>
  );
};

// Overload for getting the entire state
export function useUIStore(): UIState;

// Overload for selecting a part of the state
export function useUIStore<T>(
  selector: (state: UIState) => T,
  equalityFn?: (a: T, b: T) => boolean,
): T;

// Implementation
export function useUIStore<T = UIState>(
  selector?: (state: UIState) => T,
  equalityFn?: (a: T, b: T) => boolean,
): T {
  const storeApi = useContext(UIStoreContext);
  if (!storeApi) {
    throw new Error(
      "useUIStore must be used within a UIStoreProvider. Make sure the component is wrapped in UIStoreProvider.",
    );
  }

  // If selector is undefined, return the entire state
  if (selector === undefined) {
    return useStore(storeApi) as unknown as T;
  }

  // Otherwise, return the selected part of the state
  return useStore(storeApi, selector);
}
