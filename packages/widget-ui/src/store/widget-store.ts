'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WidgetConfig, WidgetState } from '@/types/widget';

// Default widget configuration
const defaultConfig: WidgetConfig = {
  title: 'Chat Assistant',
  primaryColor: '#4F46E5',
  primaryTextColor: '#FFFFFF',
  welcomeMessage: 'Hello! How can I help you today?',
  position: 'bottom-right',
  height: 600,
  width: 400,
  offset: 20,
  buttonIcon: 'message',
  darkMode: 'auto',
  roundedDesign: true,
  autoOpen: false,
  autoOpenDelay: 5000
};

/**
 * Store for widget state and configuration
 */
export const useWidgetStore = create<WidgetState>()(
  persist(
    (set) => ({
      // Initial state
      isOpen: false,
      isInitialized: false,
      config: defaultConfig,
      
      // Actions
      toggleWidget: () => set((state) => ({ isOpen: !state.isOpen })),
      openWidget: () => set({ isOpen: true }),
      closeWidget: () => set({ isOpen: false }),
      
      updateConfig: (config) => 
        set((state) => ({ 
          config: { ...state.config, ...config } 
        })),
      
      initialize: () => set({ isInitialized: true }),
    }),
    {
      name: 'chat-widget-storage',
      partialize: (state) => ({
        config: state.config,
      })
    }
  )
);
