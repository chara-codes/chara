import { create } from "zustand";
import { fetchModels } from "../services";
import type { Model } from "../types";

// Fallback data in case fetch fails
const fallbackModels: Model[] = [
  { id: "claude-3.7-sonnet", name: "Claude 3.7 Sonnet", provider: "Anthropic" },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
];

interface ModelsState {
  models: Model[];
  recentModels: string[];
  isLoading: boolean;
  loadError: string | null;
  initializeStore: () => Promise<void>;
  addRecentModel: (modelId: string) => void;
}

export const useModelsStore = create<ModelsState>()((set) => ({
  models: [],
  recentModels: [],
  isLoading: true,
  loadError: null,

  initializeStore: async () => {
    set({ isLoading: true, loadError: null });
    try {
      console.log("Models Store: Starting models fetch...");

      // Add timeout to models fetch
      const fetchPromise = fetchModels();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Models fetch timeout")), 10000)
      );

      const { models } = await Promise.race([fetchPromise, timeoutPromise]);
      console.log("Models Store: Models fetched successfully");

      set({
        models: models.length > 0 ? models : fallbackModels,
        recentModels: ["claude-3.7-sonnet"],
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to initialize models store:", error);
      set({
        models: fallbackModels,
        recentModels: ["claude-3.7-sonnet"],
        isLoading: false,
        loadError:
          error instanceof Error ? error.message : "Failed to load models data",
      });
    }
  },

  addRecentModel: (modelId) => {
    set((state) => {
      // Remove the model if it's already in the list
      const filteredRecent = state.recentModels.filter((id) => id !== modelId);
      // Add it to the beginning
      return { recentModels: [modelId, ...filteredRecent].slice(0, 5) };
    });
  },
}));
