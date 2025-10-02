import { z } from "zod";
import { SettingsService } from "../../services/settingsService";
import {
  CreateProviderSchema,
  UpdateProviderSchema,
} from "../../types/settings";
import { logger } from "../../utils/logger";
import { publicProcedure, router } from "../trpc";

// Initialize settings service
const settingsService = new SettingsService();

export const settingsRouter = router({
  // Provider Management Endpoints
  providers: router({
    // Get all providers
    list: publicProcedure.query(async () => {
      try {
        const providers = await settingsService.getProviders();
        return providers;
      } catch (err) {
        logger.error(JSON.stringify(err), "providers.list endpoint failed");
        throw err;
      }
    }),

    // Create a new provider
    create: publicProcedure
      .input(CreateProviderSchema)
      .mutation(async ({ input }) => {
        try {
          const provider = await settingsService.createProvider(input);
          return provider;
        } catch (err) {
          logger.error(JSON.stringify(err), "providers.create endpoint failed");
          throw err;
        }
      }),

    // Update an existing provider
    update: publicProcedure
      .input(UpdateProviderSchema)
      .mutation(async ({ input }) => {
        try {
          const provider = await settingsService.updateProvider(
            input.id,
            input.updates
          );
          return provider;
        } catch (err) {
          logger.error(JSON.stringify(err), "providers.update endpoint failed");
          throw err;
        }
      }),

    // Delete a provider
    delete: publicProcedure
      .input(
        z.object({
          id: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await settingsService.deleteProvider(input.id);
          return { success: true };
        } catch (err) {
          logger.error(JSON.stringify(err), "providers.delete endpoint failed");
          throw err;
        }
      }),

    // Get providers by type
    getByType: publicProcedure
      .input(
        z.object({
          type: z.string(),
        })
      )
      .query(async ({ input }) => {
        try {
          const providers = await settingsService.getProvidersByType(
            input.type
          );
          return providers;
        } catch (err) {
          logger.error(
            JSON.stringify(err),
            "providers.getByType endpoint failed"
          );
          throw err;
        }
      }),
  }),

  // Model Management Endpoints
  models: router({
    // Get available models from the models service
    getAvailable: publicProcedure.query(async () => {
      try {
        const models = await settingsService.getAvailableModels();
        return models;
      } catch (err) {
        logger.error(
          JSON.stringify(err),
          "models.getAvailable endpoint failed"
        );
        throw err;
      }
    }),

    // Get enabled models list
    getEnabled: publicProcedure.query(async () => {
      try {
        const enabledModels = await settingsService.getEnabledModels();
        return enabledModels;
      } catch (err) {
        logger.error(JSON.stringify(err), "models.getEnabled endpoint failed");
        throw err;
      }
    }),

    // Get enabled models with full configuration
    getEnabledWithConfig: publicProcedure.query(async () => {
      try {
        const enabledModelsConfig =
          await settingsService.getEnabledModelsWithConfig();
        return enabledModelsConfig;
      } catch (err) {
        logger.error(
          JSON.stringify(err),
          "models.getEnabledWithConfig endpoint failed"
        );
        throw err;
      }
    }),

    // Enable a model
    enable: publicProcedure
      .input(
        z.object({
          modelId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await settingsService.enableModel(input.modelId);
          return { success: true, modelId: input.modelId };
        } catch (err) {
          logger.error(JSON.stringify(err), "models.enable endpoint failed");
          throw err;
        }
      }),

    // Disable a model
    disable: publicProcedure
      .input(
        z.object({
          modelId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await settingsService.disableModel(input.modelId);
          return { success: true, modelId: input.modelId };
        } catch (err) {
          logger.error(JSON.stringify(err), "models.disable endpoint failed");
          throw err;
        }
      }),

    // Get models by provider
    getByProvider: publicProcedure
      .input(
        z.object({
          provider: z.string(),
        })
      )
      .query(async ({ input }) => {
        try {
          const models = await settingsService.getModelsByProvider(
            input.provider
          );
          return models;
        } catch (err) {
          logger.error(
            JSON.stringify(err),
            "models.getByProvider endpoint failed"
          );
          throw err;
        }
      }),
  }),

  // Configuration Management Endpoints
  config: router({
    // Get global configuration
    get: publicProcedure.query(async () => {
      try {
        const config = await settingsService.getGlobalConfig();
        return config;
      } catch (err) {
        logger.error(JSON.stringify(err), "config.get endpoint failed");
        throw err;
      }
    }),

    // Update global configuration
    update: publicProcedure
      .input(
        z.object({
          config: z.record(z.any()),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await settingsService.updateGlobalConfig(input.config);
          return { success: true };
        } catch (err) {
          logger.error(JSON.stringify(err), "config.update endpoint failed");
          throw err;
        }
      }),
  }),
});
