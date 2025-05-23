"use client"

import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import type React from "react"
import { createContext, useContext, useRef, type ReactNode } from "react"

// Define min and max width constraints
export const PANEL_WIDTH_CONSTRAINTS = {
  MIN: 350,
  MAX: 800,
  DEFAULT: 400,
}

// Define keyboard shortcut settings
export interface KeyboardShortcut {
  key: string
  description: string
  enabled: boolean
  action: string
}

interface UIState {
  // Chat overlay visibility
  isChatOverlayOpen: boolean
  // Chat overlay width
  chatOverlayWidth: number
  // Keyboard shortcuts
  keyboardShortcuts: KeyboardShortcut[]
  // Visual feedback for shortcut activation
  showShortcutFeedback: boolean

  // Actions
  toggleChatOverlay: () => void
  openChatOverlay: () => void
  closeChatOverlay: () => void
  setChatOverlayWidth: (width: number) => void
  resetChatOverlayWidth: () => void

  // Keyboard shortcut actions
  updateKeyboardShortcut: (action: string, updates: Partial<KeyboardShortcut>) => void
  triggerShortcutFeedback: () => void

  // Shortcut handling
  handleKeyboardShortcut: (key: string) => boolean
}

// Default keyboard shortcuts
const defaultKeyboardShortcuts: KeyboardShortcut[] = [
  {
    key: "±",
    description: "Toggle chat overlay panel",
    enabled: true,
    action: "toggleChatOverlay",
  },
  {
    key: "Escape",
    description: "Close chat overlay or navigate back",
    enabled: true,
    action: "closeOrNavigateBack",
  },
  {
    key: "Ctrl+/",
    description: "Focus search input",
    enabled: true,
    action: "focusSearch",
  },
]

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isChatOverlayOpen: false,
        chatOverlayWidth: PANEL_WIDTH_CONSTRAINTS.DEFAULT,
        keyboardShortcuts: defaultKeyboardShortcuts,
        showShortcutFeedback: false,

        // Actions
        toggleChatOverlay: () => set((state) => ({ isChatOverlayOpen: !state.isChatOverlayOpen })),
        openChatOverlay: () => set({ isChatOverlayOpen: true }),
        closeChatOverlay: () => set({ isChatOverlayOpen: false }),
        setChatOverlayWidth: (width: number) => {
          // Ensure width is within constraints
          const constrainedWidth = Math.max(PANEL_WIDTH_CONSTRAINTS.MIN, Math.min(width, PANEL_WIDTH_CONSTRAINTS.MAX))
          set({ chatOverlayWidth: constrainedWidth })
        },
        resetChatOverlayWidth: () => set({ chatOverlayWidth: PANEL_WIDTH_CONSTRAINTS.DEFAULT }),

        // Keyboard shortcut actions
        updateKeyboardShortcut: (action: string, updates: Partial<KeyboardShortcut>) => {
          set((state) => ({
            keyboardShortcuts: state.keyboardShortcuts.map((shortcut) =>
              shortcut.action === action ? { ...shortcut, ...updates } : shortcut,
            ),
          }))
        },

        triggerShortcutFeedback: () => {
          set({ showShortcutFeedback: true })
          setTimeout(() => set({ showShortcutFeedback: false }), 500)
        },

        // Handle keyboard shortcuts
        handleKeyboardShortcut: (key: string) => {
          const { keyboardShortcuts } = get()
          const matchingShortcut = keyboardShortcuts.find((shortcut) => shortcut.key === key && shortcut.enabled)

          if (!matchingShortcut) return false

          // Trigger visual feedback
          get().triggerShortcutFeedback()

          // Execute the corresponding action
          switch (matchingShortcut.action) {
            case "toggleChatOverlay":
              get().toggleChatOverlay()
              return true

            case "closeOrNavigateBack":
              if (get().isChatOverlayOpen) {
                get().closeChatOverlay()
                return true
              }
              return false // Let the routing store handle navigation back

            case "focusSearch":
              // This will be handled by the component that renders the search input
              return true

            default:
              return false
          }
        },
      }),
      {
        name: "ai-chat-ui-storage",
        partialize: (state) => ({
          isChatOverlayOpen: state.isChatOverlayOpen,
          chatOverlayWidth: state.chatOverlayWidth,
          keyboardShortcuts: state.keyboardShortcuts,
        }),
      },
    ),
  ),
)

// Create a context for the UI store
type UIStoreContextValue = {
  store: typeof useUIStore
}

const UIStoreContext = createContext<UIStoreContextValue | null>(null)

// Create a provider component
interface UIStoreProviderProps {
  children: ReactNode
}

export const UIStoreProvider: React.FC<UIStoreProviderProps> = ({ children }) => {
  const storeRef = useRef(useUIStore)

  return <UIStoreContext.Provider value={{ store: storeRef.current }}>{children}</UIStoreContext.Provider>
}

// Hook to use the UI store context
export const useUIStoreContext = () => {
  const context = useContext(UIStoreContext)
  if (!context) {
    throw new Error("useUIStoreContext must be used within a UIStoreProvider")
  }
  return context.store
}
