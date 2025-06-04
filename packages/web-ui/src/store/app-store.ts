"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  // Layout state
  showPreview: boolean;
  previewSize: number;
  
  // Sync state
  syncWithChat: boolean;
  
  // Actions
  togglePreview: () => void;
  setPreviewSize: (size: number) => void;
  toggleSyncWithChat: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Layout state
      showPreview: true,
      previewSize: 50, // percentage of screen width
      
      // Sync state
      syncWithChat: true,
      
      // Actions
      togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
      setPreviewSize: (size) => set({ previewSize: size }),
      toggleSyncWithChat: () => set((state) => ({ syncWithChat: !state.syncWithChat })),
    }),
    {
      name: "chat-preview-app-state",
    }
  )
);
