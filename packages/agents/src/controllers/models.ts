import {
  getModelsWhitelist,
  readGlobalConfig,
  type ModelConfig,
} from "@chara-codes/settings";
import {
  fetchAllModels,
  fetchModels,
  hasProvider,
  providersRegistry,
  type ModelInfo,
} from "../providers";
import { logger } from "../utils/logger";

export const modelsController = {
  async getModels(req: Request) {
    logger.info("Fetch Models Started");
    try {
      const url = new URL(req.url);
      const providerParam = url.searchParams.get("provider");

      let allModels: Record<string, ModelInfo[]>;

      if (providerParam) {
        // Check if provider exists and is enabled
        let isProviderAvailable = await hasProvider(providerParam);
        if (!isProviderAvailable) {
          // Check if provider exists in global config
          try {
            const config = await readGlobalConfig();
            const providerConfig = config.providers?.[providerParam];
            if (providerConfig?.enabled) {
              // Reinitialize registry to pick up the provider
              await providersRegistry.initialize();
              // Check again
              isProviderAvailable = await hasProvider(providerParam);
              if (!isProviderAvailable) {
                return Response.json(
                  {
                    error: `Provider '${providerParam}' is configured but could not be initialized`,
                  },
                  { status: 400 }
                );
              }
            } else {
              return Response.json(
                {
                  error: `Provider '${providerParam}' is not available or enabled`,
                },
                { status: 400 }
              );
            }
          } catch (error) {
            return Response.json(
              {
                error: `Failed to check global config: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`,
              },
              { status: 500 }
            );
          }
        }
        // Fetch models for the specific provider
        const models = await fetchModels(providerParam);
        allModels = { [providerParam]: models };
      } else {
        // Fetch all models
        allModels = await fetchAllModels();
      }

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
          error
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
            // Use dynamic whitelist from settings - check both prefixed and non-prefixed IDs
            const prefixedId = `${provider}:::${model.id}`;
            return whitelistIds.has(model.id) || whitelistIds.has(prefixedId);
          })
          .map((model) => {
            // Find whitelist model for enhanced metadata - check both prefixed and non-prefixed
            const prefixedId = `${provider}:::${model.id}`;
            const whitelistModel = whitelistedModels.find(
              (w) => w.id === model.id || w.id === prefixedId
            );

            return {
              id: model.id,
              name: model.name || model.id,
              provider: provider,
              // Add enhanced fields from whitelist if available
              ...(whitelistModel &&
                (provider === whitelistModel.provider ||
                  whitelistModel.id === prefixedId) && {
                  name: whitelistModel.name,
                  contextSize: whitelistModel.contextSize,
                  hasTools: whitelistModel.hasTools,
                  recommended: whitelistModel.recommended,
                  approved: whitelistModel.approved,
                }),
            };
          })
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
        }
      );
    } catch (error) {
      return Response.json(
        {
          error: "Failed to fetch models",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  },
};
