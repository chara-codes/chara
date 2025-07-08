import { fetchAllModels } from "../providers";
import { getModelsWhitelist, type ModelConfig } from "@apk/settings";

export const modelsController = {
  async getModels(req: Request) {
    try {
      const allModels = await fetchAllModels();

      // Get whitelist from settings with fallback to legacy whitelist
      let whitelistedModels: ModelConfig[] = [];
      let whitelistIds: Set<string>;

      try {
        whitelistedModels = await getModelsWhitelist();
        whitelistIds = new Set(whitelistedModels.map((m) => m.id));
      } catch (error) {
        // Fallback to legacy whitelist if settings unavailable
        console.warn(
          "Failed to load models whitelist from settings, using legacy whitelist:",
          error,
        );
        whitelistIds = new Set();
      }

      const models = Object.entries(allModels).flatMap(([provider, models]) =>
        models
          .filter((model) => {
            const url = new URL(req.url);
            // Check if provider filtering is requested
            const providerParam = url.searchParams.get("provider");
            if (providerParam && providerParam !== provider) {
              return false;
            }
            // Skip filtering if 'all' query param exists
            if (url.searchParams.has("all")) {
              return true;
            }
            // Include all ollama models
            if (provider === "ollama" || provider === "lmstudio") {
              return true;
            }
            // Use dynamic whitelist from settings
            return whitelistIds.has(model.id);
          })
          .map((model) => {
            // Find whitelist model for enhanced metadata
            const whitelistModel = whitelistedModels.find(
              (w) => w.id === model.id,
            );

            return {
              id: model.id,
              name: model.name || model.id,
              provider: provider,
              // Add enhanced fields from whitelist if available
              ...(whitelistModel &&
                provider === whitelistModel.provider && {
                  name: whitelistModel.name,
                  contextSize: whitelistModel.contextSize,
                  hasTools: whitelistModel.hasTools,
                  recommended: whitelistModel.recommended,
                  approved: whitelistModel.approved,
                }),
            };
          }),
      );

      return Response.json(
        { models },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
              "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        },
      );
    } catch (error) {
      return Response.json(
        {
          error: "Failed to fetch models",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  },
};
