"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"

// Define the available screens/views in the application
export enum Screen {
  CONVERSATION = "conversation",
  HISTORY = "history",
  SETTINGS = "settings",
  NEW_THREAD = "new_thread",
}

// Define the routing state interface
interface RoutingState {
  // Current active screen
  currentScreen: Screen

  // Previous screen (for back navigation)
  previousScreen: Screen | null

  // Navigation history stack
  navigationHistory: Screen[]

  // Actions
  navigateToScreen: (screen: Screen) => void
  navigateBack: () => void
  navigateToNewThread: () => void
  navigateToHistory: () => void
  navigateToSettings: () => void
  navigateToConversation: () => void
  resetNavigation: () => void
}

export const useRoutingStore = create<RoutingState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentScreen: Screen.CONVERSATION,
      previousScreen: null,
      navigationHistory: [Screen.CONVERSATION],

      // Generic navigation action
      navigateToScreen: (screen: Screen) => {
        const currentState = get()

        set({
          previousScreen: currentState.currentScreen,
          currentScreen: screen,
          navigationHistory: [...currentState.navigationHistory, screen],
        })
      },

      // Navigate back to previous screen
      navigateBack: () => {
        const currentState = get()
        const history = currentState.navigationHistory

        if (history.length > 1) {
          const newHistory = history.slice(0, -1)
          const previousScreen = newHistory[newHistory.length - 1]

          set({
            currentScreen: previousScreen,
            previousScreen: currentState.currentScreen,
            navigationHistory: newHistory,
          })
        }
      },

      // Specific navigation actions
      navigateToNewThread: () => {
        get().navigateToScreen(Screen.NEW_THREAD)
      },

      navigateToHistory: () => {
        get().navigateToScreen(Screen.HISTORY)
      },

      navigateToSettings: () => {
        get().navigateToScreen(Screen.SETTINGS)
      },

      navigateToConversation: () => {
        get().navigateToScreen(Screen.CONVERSATION)
      },

      // Reset navigation to initial state
      resetNavigation: () => {
        set({
          currentScreen: Screen.CONVERSATION,
          previousScreen: null,
          navigationHistory: [Screen.CONVERSATION],
        })
      },
    }),
    {
      name: "routing-store",
    },
  ),
)

// Selector hooks for common use cases
export const useCurrentScreen = () => useRoutingStore((state) => state.currentScreen)
export const usePreviousScreen = () => useRoutingStore((state) => state.previousScreen)

// Individual action selectors to prevent creating new objects on each render
export const useNavigateToNewThread = () => useRoutingStore((state) => state.navigateToNewThread)
export const useNavigateToHistory = () => useRoutingStore((state) => state.navigateToHistory)
export const useNavigateToSettings = () => useRoutingStore((state) => state.navigateToSettings)
export const useNavigateToConversation = () => useRoutingStore((state) => state.navigateToConversation)
export const useNavigateBack = () => useRoutingStore((state) => state.navigateBack)
