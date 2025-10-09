import { useModelsStore } from "../stores/models-store";

/**
 * Service for coordinating model updates across components
 * This service provides utilities for notifying the models store when models change
 */
class ModelSyncService {
  private static instance: ModelSyncService;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): ModelSyncService {
    if (!ModelSyncService.instance) {
      ModelSyncService.instance = new ModelSyncService();
    }
    return ModelSyncService.instance;
  }

  /**
   * Notify that models have been updated (enabled/disabled)
   * This will trigger a refetch of models and notify all subscribers
   */
  public notifyModelsChanged(): void {
    console.log("ModelSyncService: Models changed, triggering store updates");
    const modelsStore = useModelsStore.getState();
    modelsStore.notifyModelsChanged();

    // Also trigger a refetch to get the latest models
    modelsStore.refetchModels().catch((error) => {
      console.error("Failed to refetch models after change:", error);
    });
  }

  /**
   * Subscribe to model changes
   * @param callback Function to call when models change
   * @returns Unsubscribe function
   */
  public onModelsChange(callback: () => void): () => void {
    const modelsStore = useModelsStore.getState();
    return modelsStore.onModelsChange(callback);
  }

  /**
   * Manually trigger model refetch
   * Useful for components that need to force refresh models
   */
  public async refetchModels(): Promise<void> {
    const modelsStore = useModelsStore.getState();
    await modelsStore.refetchModels();
  }
}

// Export singleton instance
export const modelSyncService = ModelSyncService.getInstance();

// Export hook for easy use in React components
export const useModelSync = () => {
  return {
    notifyModelsChanged: () => modelSyncService.notifyModelsChanged(),
    onModelsChange: (callback: () => void) =>
      modelSyncService.onModelsChange(callback),
    refetchModels: () => modelSyncService.refetchModels(),
  };
};
