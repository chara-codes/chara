import { create } from "zustand";
import { getVanillaTrpcClient } from "../services";

interface Provider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  configuration: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface ProvidersState {
  providers: Provider[];
  isLoading: boolean;
  loadError: string | null;
  initializeStore: () => Promise<void>;
  refetchProviders: () => Promise<void>;
  updateProviderEnabled: (
    providerId: string,
    enabled: boolean
  ) => Promise<void>;
  onProvidersChange: (callback: () => void) => () => void;
}

// Store callbacks for provider changes
let changeCallbacks: (() => void)[] = [];

export const useProvidersStore = create<ProvidersState>()((set, _get) => ({
  providers: [],
  isLoading: true,
  loadError: null,

  initializeStore: async () => {
    set({ isLoading: true, loadError: null });
    try {
      console.log("Providers Store: Starting providers fetch...");

      const client = getVanillaTrpcClient();
      const providers = await client.settings.providers.list.query();

      console.log("Providers Store: Providers fetched successfully");

      set({
        providers,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to initialize providers store:", error);
      set({
        providers: [],
        isLoading: false,
        loadError:
          error instanceof Error
            ? error.message
            : "Failed to load providers data",
      });
    }
  },

  refetchProviders: async () => {
    set({ isLoading: true, loadError: null });
    try {
      console.log("Providers Store: Refetching providers...");

      const client = getVanillaTrpcClient();
      const providers = await client.settings.providers.list.query();

      console.log("Providers Store: Providers refetched successfully");

      set({
        providers,
        isLoading: false,
      });

      // Notify all subscribers about provider changes
      changeCallbacks.forEach((callback) => {
        callback();
      });
    } catch (error) {
      console.error("Failed to refetch providers:", error);
      set({
        isLoading: false,
        loadError:
          error instanceof Error
            ? error.message
            : "Failed to refetch providers data",
      });
    }
  },

  updateProviderEnabled: async (providerId: string, enabled: boolean) => {
    try {
      const client = getVanillaTrpcClient();
      await client.settings.providers.update.mutate({
        id: providerId,
        updates: { enabled },
      });

      // Update local state
      set((state) => ({
        providers: state.providers.map((provider) =>
          provider.id === providerId
            ? { ...provider, enabled, updatedAt: new Date() }
            : provider
        ),
      }));

      // Notify all subscribers about provider changes
      changeCallbacks.forEach((callback) => {
        callback();
      });
    } catch (error) {
      console.error("Failed to update provider:", error);
      throw error;
    }
  },

  onProvidersChange: (callback: () => void) => {
    changeCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      changeCallbacks = changeCallbacks.filter((cb) => cb !== callback);
    };
  },
}));
