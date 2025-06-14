"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Define the available screens/views in the application
export enum Screen {
  CONVERSATION = "conversation",
  HISTORY = "history",
  SETTINGS = "settings",
  NEW_THREAD = "new_thread",
  TECH_STACKS = "tech_stacks",
  ADD_TECH_STACK = "add_tech_stack", // New screen for adding tech stacks
  EDIT_TECH_STACK = "edit_tech_stack", // New screen for editing tech stacks
  TERMINAL = "terminal", // New screen for terminal interface
}

// Define the routing state interface
interface RoutingState {
  // Current active screen
  currentScreen: Screen;

  // Previous screen (for back navigation)
  previousScreen: Screen | null;

  // Navigation history stack
  navigationHistory: Screen[];

  // Selected tech stack ID for editing
  selectedTechStackId: string | null;

  // Actions
  navigateToScreen: (screen: Screen) => void;
  navigateBack: () => void;
  navigateToNewThread: () => void;
  navigateToHistory: () => void;
  navigateToSettings: () => void;
  navigateToTechStacks: () => void;
  navigateToAddTechStack: () => void;
  navigateToEditTechStack: (techStackId: string) => void;
  navigateToConversation: () => void;
  navigateToTerminal: () => void;
  resetNavigation: () => void;
}

export const useRoutingStore = create<RoutingState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentScreen: Screen.CONVERSATION,
      previousScreen: null,
      navigationHistory: [Screen.CONVERSATION],
      selectedTechStackId: null,

      // Generic navigation action
      navigateToScreen: (screen: Screen) => {
        const currentState = get();

        set({
          previousScreen: currentState.currentScreen,
          currentScreen: screen,
          navigationHistory: [...currentState.navigationHistory, screen],
        });
      },

      // Navigate back to previous screen
      navigateBack: () => {
        const currentState = get();
        const history = currentState.navigationHistory;

        if (history.length > 1) {
          const newHistory = history.slice(0, -1);
          const previousScreen = newHistory[newHistory.length - 1];

          set({
            currentScreen: previousScreen,
            previousScreen: currentState.currentScreen,
            navigationHistory: newHistory,
            // Clear selected tech stack ID when navigating back
            selectedTechStackId: null,
          });
        }
      },

      // Specific navigation actions
      navigateToNewThread: () => {
        get().navigateToScreen(Screen.NEW_THREAD);
      },

      navigateToHistory: () => {
        get().navigateToScreen(Screen.HISTORY);
      },

      navigateToSettings: () => {
        get().navigateToScreen(Screen.SETTINGS);
      },

      navigateToTechStacks: () => {
        get().navigateToScreen(Screen.TECH_STACKS);
      },

      navigateToAddTechStack: () => {
        get().navigateToScreen(Screen.ADD_TECH_STACK);
      },

      navigateToEditTechStack: (techStackId: string) => {
        set({
          selectedTechStackId: techStackId,
        });
        get().navigateToScreen(Screen.EDIT_TECH_STACK);
      },

      navigateToConversation: () => {
        get().navigateToScreen(Screen.CONVERSATION);
      },

      navigateToTerminal: () => {
        get().navigateToScreen(Screen.TERMINAL);
      },

      // Reset navigation to initial state
      resetNavigation: () => {
        set({
          currentScreen: Screen.CONVERSATION,
          previousScreen: null,
          navigationHistory: [Screen.CONVERSATION],
          selectedTechStackId: null,
        });
      },
    }),
    {
      name: "routing-store",
    },
  ),
);

// Selector hooks for common use cases
export const useCurrentScreen = () =>
  useRoutingStore((state) => state.currentScreen);
export const usePreviousScreen = () =>
  useRoutingStore((state) => state.previousScreen);
export const useSelectedTechStackId = () =>
  useRoutingStore((state) => state.selectedTechStackId);

// Individual action selectors to prevent creating new objects on each render
export const useNavigateToNewThread = () =>
  useRoutingStore((state) => state.navigateToNewThread);
export const useNavigateToHistory = () =>
  useRoutingStore((state) => state.navigateToHistory);
export const useNavigateToSettings = () =>
  useRoutingStore((state) => state.navigateToSettings);
export const useNavigateToTechStacks = () =>
  useRoutingStore((state) => state.navigateToTechStacks);
export const useNavigateToAddTechStack = () =>
  useRoutingStore((state) => state.navigateToAddTechStack);
export const useNavigateToEditTechStack = () =>
  useRoutingStore((state) => state.navigateToEditTechStack);
export const useNavigateToConversation = () =>
  useRoutingStore((state) => state.navigateToConversation);
export const useNavigateToTerminal = () =>
  useRoutingStore((state) => state.navigateToTerminal);
export const useNavigateBack = () =>
  useRoutingStore((state) => state.navigateBack);
