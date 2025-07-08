import { logger } from "@chara-codes/logger";
import {
  fetchModels,
  fetchAllModels,
  getAvailableProviders,
  hasProvider,
} from "../src/providers";

/**
 * Demonstrates model fetching capabilities
 */
async function demonstrateModelFetching() {
  logger.info("🔍 Model Fetching Demo");

  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    logger.error("No providers available for model fetching demo");
    return;
  }

  // 1. Show which providers support model fetching
  logger.info("📋 Providers supporting model fetching:");
  for (const provider of availableProviders) {
    const providerName = provider.name.toLowerCase();
    const supportsModelFetching = provider.fetchModels !== undefined;
    if (supportsModelFetching) {
      logger.success(`${provider.name} supports model fetching`);
    } else {
      logger.warning(`${provider.name} does not support model fetching yet`);
    }
  }

  // 2. Fetch models for OpenAI (if available)
  if (hasProvider("openai")) {
    logger.info("🤖 Fetching OpenAI models:");
    try {
      const openaiModels = await fetchModels("openai");
      logger.success(`Found ${openaiModels.length} OpenAI models:`, {
        sampleModels: openaiModels.slice(0, 5).map((m) => ({
          id: m.id,
          name: m.name || m.id,
        })),
        totalCount: openaiModels.length,
      });
    } catch (error) {
      logger.error("Failed to fetch OpenAI models:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // 3. Fetch models for all providers
  logger.info("🌐 Fetching models for all providers:");
  try {
    const allModels = await fetchAllModels();

    const summary = Object.entries(allModels).map(([provider, models]) => ({
      provider,
      modelCount: models.length,
      hasModels: models.length > 0,
      sampleModels: models.slice(0, 3).map((m) => m.id),
    }));

    logger.success("Model fetching summary:", { summary });

    // 4. Show some interesting statistics
    const totalModels = Object.values(allModels).reduce(
      (sum, models) => sum + models.length,
      0,
    );
    const providersWithModels = Object.entries(allModels).filter(
      ([_, models]) => models.length > 0,
    ).length;

    logger.info("📊 Statistics:", {
      totalProviders: Object.keys(allModels).length,
      providersWithModels,
      totalModels,
      averageModelsPerProvider: Math.round(
        totalModels / Object.keys(allModels).length,
      ),
    });
  } catch (error) {
    logger.error("Failed to fetch all models:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 5. Demonstrate finding specific model types
  logger.info("🎯 Finding specific model types:");
  try {
    const allModels = await fetchAllModels();

    // Find GPT models
    const gptModels = Object.entries(allModels).flatMap(([provider, models]) =>
      models
        .filter((m) => m.id.toLowerCase().includes("gpt"))
        .map((m) => ({ provider, model: m.id })),
    );

    if (gptModels.length > 0) {
      logger.info(`Found ${gptModels.length} GPT models:`, {
        models: gptModels.slice(0, 5),
      });
    }

    // Find Claude models
    const claudeModels = Object.entries(allModels).flatMap(
      ([provider, models]) =>
        models
          .filter((m) => m.id.toLowerCase().includes("claude"))
          .map((m) => ({ provider, model: m.id })),
    );

    if (claudeModels.length > 0) {
      logger.info(`Found ${claudeModels.length} Claude models:`, {
        models: claudeModels,
      });
    }

    // Find latest/newest models
    const latestModels = Object.entries(allModels).flatMap(
      ([provider, models]) =>
        models
          .filter(
            (m) =>
              m.id.toLowerCase().includes("latest") ||
              m.id.toLowerCase().includes("new"),
          )
          .map((m) => ({ provider, model: m.id })),
    );

    if (latestModels.length > 0) {
      logger.info(`Found ${latestModels.length} "latest" models:`, {
        models: latestModels,
      });
    }
  } catch (error) {
    logger.error("Failed to analyze model types:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Demonstrates error handling for model fetching
 */
async function demonstrateErrorHandling() {
  logger.info("🚫 Error Handling Demo:");

  // Try to fetch models from a non-existent provider
  try {
    await fetchModels("non-existent-provider");
    logger.error("This should not print");
  } catch (error) {
    logger.success("Correctly caught error for non-existent provider:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Try to fetch models from a provider that doesn't support it
  const availableProviders = getAvailableProviders();
  const providerWithoutFetching = availableProviders.find(
    (p) => !p.fetchModels,
  );

  if (providerWithoutFetching) {
    try {
      await fetchModels(providerWithoutFetching.name.toLowerCase());
      logger.error("This should not print");
    } catch (error) {
      logger.success(
        `Correctly caught error for ${providerWithoutFetching.name} (no model fetching support):`,
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
    }
  }
}

/**
 * Main demo function
 */
async function main() {
  try {
    await demonstrateModelFetching();
    await demonstrateErrorHandling();
    logger.success("✨ Model fetching demo completed successfully!");
  } catch (error) {
    logger.error("Demo failed:", { error });
  }
}

// Export functions for use in other modules
export { demonstrateModelFetching, demonstrateErrorHandling, main };

// Run the demo if this file is executed directly
if (import.meta.main) {
  main();
}
