import { logger } from "@apk/logger";
import { fetchModels, hasProvider } from "../src/providers";

async function demonstrateOpenRouterModels() {
  logger.info("🚀 OpenRouter Models Demo");

  // Check if OpenRouter is available
  if (!hasProvider("openrouter")) {
    logger.error(
      "OpenRouter provider is not available. Please check your OPEN_ROUTER_API_KEY environment variable.",
    );
    process.exit(1);
  }

  logger.info("✅ OpenRouter provider is available");

  try {
    // Fetch all OpenRouter models
    logger.info("🔍 Fetching OpenRouter models...");
    const models = await fetchModels("openrouter");

    logger.info(`📊 Found ${models.length} OpenRouter models`);

    // Show first 10 models
    logger.info("📋 Sample models (first 10):");
    models.slice(0, 10).forEach((model, index) => {
      logger.info(
        `${index + 1}. ${model.id}${model.name ? ` (${model.name})` : ""}`,
      );
      if (model.description) {
        logger.info(
          `   Description: ${model.description.substring(0, 100)}${model.description.length > 100 ? "..." : ""}`,
        );
      }
      if (model.contextLength) {
        logger.info(
          `   Context Length: ${model.contextLength.toLocaleString()} tokens`,
        );
      }
    });

    // Filter by provider
    const anthropicModels = models.filter((m) => m.id.startsWith("anthropic/"));
    const openaiModels = models.filter((m) => m.id.startsWith("openai/"));
    const metaModels = models.filter((m) => m.id.startsWith("meta-llama/"));
    const googleModels = models.filter((m) => m.id.startsWith("google/"));
    const mistralModels = models.filter((m) => m.id.startsWith("mistralai/"));
    const deepseekModels = models.filter((m) => m.id.startsWith("deepseek/"));
    const qwenModels = models.filter((m) => m.id.startsWith("qwen/"));

    logger.info("🏢 Models by provider:");
    logger.info(`  • Anthropic (Claude): ${anthropicModels.length} models`);
    logger.info(`  • OpenAI (GPT): ${openaiModels.length} models`);
    logger.info(`  • Meta (Llama): ${metaModels.length} models`);
    logger.info(`  • Google (Gemini): ${googleModels.length} models`);
    logger.info(`  • Mistral: ${mistralModels.length} models`);
    logger.info(`  • Deepseek: ${deepseekModels.length} models`);
    logger.info(`  • Qwen: ${qwenModels.length} models`);

    // Show popular models
    const popularModels = [
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "meta-llama/llama-3.1-70b-instruct",
      "google/gemini-pro-1.5",
      "mistralai/mistral-large",
    ];

    logger.info("⭐ Popular models availability:");
    for (const modelId of popularModels) {
      const model = models.find((m) => m.id === modelId);
      if (model) {
        logger.info(`  ✅ ${modelId}${model.name ? ` (${model.name})` : ""}`);
        if (model.contextLength) {
          logger.info(
            `     Context: ${model.contextLength.toLocaleString()} tokens`,
          );
        }
      } else {
        logger.info(`  ❌ ${modelId} - Not available`);
      }
    }

    // Find free models
    const freeModels = models.filter((m) => m.id.includes(":free"));
    logger.info(`💰 Free models available: ${freeModels.length}`);
    if (freeModels.length > 0) {
      logger.info("🆓 Sample free models:");
      for (const model of freeModels.slice(0, 5)) {
        logger.info(`  • ${model.id}${model.name ? ` (${model.name})` : ""}`);
      }
    }

    // Find models with largest context
    const modelsWithContext = models
      .filter((m) => m.contextLength)
      .sort((a, b) => (b.contextLength || 0) - (a.contextLength || 0));
    if (modelsWithContext.length > 0) {
      logger.info("🧠 Top 5 models by context length:");
      modelsWithContext.slice(0, 5).forEach((model, index) => {
        logger.info(
          `  ${index + 1}. ${model.id} - ${model.contextLength?.toLocaleString()} tokens`,
        );
      });
    }

    // Show model categories
    const categories = {
      "Vision Models": models.filter(
        (m) =>
          m.description?.toLowerCase().includes("vision") ||
          m.id.includes("vision"),
      ),
      "Code Models": models.filter(
        (m) =>
          m.description?.toLowerCase().includes("code") ||
          m.id.includes("code"),
      ),
      "Reasoning Models": models.filter(
        (m) =>
          m.description?.toLowerCase().includes("reasoning") ||
          m.id.includes("reasoning"),
      ),
      "Fast Models": models.filter(
        (m) =>
          m.description?.toLowerCase().includes("fast") ||
          m.id.includes("turbo") ||
          m.id.includes("mini"),
      ),
    };

    logger.info("🏷️  Model categories:");
    for (const [category, categoryModels] of Object.entries(categories)) {
      if (categoryModels.length > 0) {
        logger.info(`  ${category}: ${categoryModels.length} models`);
        for (const model of categoryModels.slice(0, 3)) {
          logger.info(`    - ${model.id}`);
        }
      }
    }
  } catch (error) {
    logger.error("❌ Failed to fetch OpenRouter models:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    process.exit(1);
  }

  logger.info("✨ OpenRouter models demo completed successfully!");
}

// Run the demo
demonstrateOpenRouterModels().catch(console.error);
