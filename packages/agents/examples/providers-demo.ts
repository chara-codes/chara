import { generateText, streamText } from "ai";
import { logger } from "@chara/logger";
import {
  providersRegistry,
  getModel,
  getAvailableProviders,
  hasProvider,
  fetchModels,
  fetchAllModels,
} from "../src/providers-registry.js";

/**
 * Example demonstrating how to use the providers registry
 */
async function demonstrateProvidersRegistry() {
  logger.info("🚀 AI Providers Registry Demo");

  // 1. Check what providers are available
  logger.info("📋 Available Providers:");
  const availableProviders = getAvailableProviders();
  for (const provider of availableProviders) {
    logger.success(`${provider.name} provider is ready`);
  }

  if (availableProviders.length === 0) {
    logger.error(
      "No providers available. Please check your environment variables.",
    );
    return;
  }

  // 2. Provider information
  logger.info(
    "🤖 Providers ready for use - specify model names when calling getModel()",
  );

  // 3. Check provider status
  logger.info("📊 Provider Status:", {
    status: providersRegistry.getProviderStatus(),
  });

  // 4. Demonstrate text generation with different providers
  const prompt = "Explain quantum computing in one sentence.";

  // Try OpenAI
  if (hasProvider("openai")) {
    logger.info("🔮 Testing OpenAI:");
    try {
      const openaiModel = getModel("openai", "gpt-4o-mini");
      const openaiResult = await generateText({
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        model: openaiModel as any,
        prompt: prompt,
        maxTokens: 50,
      });
      logger.success("OpenAI Response:", { text: openaiResult.text });
    } catch (error) {
      logger.error("OpenAI Error:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Try Anthropic
  if (hasProvider("anthropic")) {
    logger.info("🧠 Testing Anthropic:");
    try {
      const anthropicModel = getModel("anthropic", "claude-3-5-haiku-20241022");
      const anthropicResult = await generateText({
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        model: anthropicModel as any,
        prompt: prompt,
        maxTokens: 50,
      });
      logger.success("Anthropic Response:", { text: anthropicResult.text });
    } catch (error) {
      logger.error("Anthropic Error:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Try Google
  if (hasProvider("google")) {
    logger.info("🌟 Testing Google:");
    try {
      const googleModel = getModel("google", "gemini-1.5-flash");
      const googleResult = await generateText({
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        model: googleModel as any,
        prompt: prompt,
        maxTokens: 50,
      });
      logger.success("Google Response:", { text: googleResult.text });
    } catch (error) {
      logger.error("Google Error:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Try Mistral
  if (hasProvider("mistral")) {
    logger.info("🌙 Testing Mistral:");
    try {
      const mistralModel = getModel("mistral", "mistral-small-latest");
      const mistralResult = await generateText({
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        model: mistralModel as any,
        prompt: prompt,
        maxTokens: 50,
      });
      logger.success("Mistral Response:", { text: mistralResult.text });
    } catch (error) {
      logger.error("Mistral Error:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // 5. Demonstrate streaming with the first available provider
  logger.info("🌊 Testing Streaming Response:");
  if (availableProviders.length > 0) {
    try {
      const firstProvider = availableProviders[0];
      if (firstProvider) {
        const providerName = firstProvider.name.toLowerCase();
        // Use a common model name that most providers support
        const modelName =
          providerName === "openai"
            ? "gpt-4o-mini"
            : providerName === "anthropic"
              ? "claude-3-5-haiku-20241022"
              : providerName === "google"
                ? "gemini-1.5-flash"
                : providerName === "mistral"
                  ? "mistral-small-latest"
                  : providerName === "groq"
                    ? "llama-3.1-8b-instant"
                    : "default-model";
        const model = getModel(providerName, modelName);

        logger.info(`Using ${firstProvider.name} for streaming...`);
        const stream = await streamText({
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          model: model as any,
          prompt: "Count from 1 to 5 slowly.",
          maxTokens: 30,
        });

        let streamedText = "";
        for await (const chunk of stream.textStream) {
          streamedText += chunk;
          process.stdout.write(chunk);
        }
        logger.success("Streaming completed", { fullText: streamedText });
      }
    } catch (error) {
      logger.error("Streaming Error:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // 6. Show error handling for unavailable providers
  logger.info("🚫 Error Handling Demo:");
  try {
    getModel("nonexistent-provider", "default-model");
    logger.error("This should not print");
  } catch (error) {
    logger.success("Properly caught error:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // 7. Show initialization errors if any
  const initErrors = providersRegistry.getInitializationErrors();
  if (initErrors.length > 0) {
    logger.warning("Initialization Errors:", { errors: initErrors });
  }
}

/**
 * Example demonstrating model fetching capabilities
 */
async function demonstrateModelFetching() {
  logger.info("🔍 Model Fetching Demo");

  const availableProviders = getAvailableProviders();
  
  if (availableProviders.length === 0) {
    logger.warning("No providers available for model fetching demo");
    return;
  }

  // 1. Fetch models for a specific provider
  logger.info("📋 Fetching models for individual providers:");
  
  for (const provider of availableProviders.slice(0, 2)) { // Test first 2 providers
    const providerName = provider.name.toLowerCase();
    try {
      logger.info(`Fetching models for ${provider.name}...`);
      const models = await fetchModels(providerName);
      
      if (models.length > 0) {
        logger.success(`${provider.name} models (showing first 5):`, {
          models: models.slice(0, 5).map(m => ({
            id: m.id,
            name: m.name || m.id,
            contextLength: m.contextLength,
          })),
          total: models.length
        });
      } else {
        logger.warning(`No models found for ${provider.name}`);
      }
    } catch (error) {
      logger.error(`Failed to fetch models for ${provider.name}:`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 2. Fetch models for all providers at once
  logger.info("🌐 Fetching models for all providers:");
  try {
    const allModels = await fetchAllModels();
    
    const summary = Object.entries(allModels).map(([provider, models]) => ({
      provider,
      modelCount: models.length,
      sampleModels: models.slice(0, 3).map(m => m.id)
    }));
    
    logger.success("All provider models summary:", { summary });
  } catch (error) {
    logger.error("Failed to fetch all models:", {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // 3. Demonstrate finding specific model types
  logger.info("🎯 Finding specific model types:");
  
  try {
    const allModels = await fetchAllModels();
    
    // Find GPT models
    const gptModels = Object.entries(allModels)
      .flatMap(([provider, models]) => 
        models
          .filter(m => m.id.toLowerCase().includes('gpt'))
          .map(m => ({ provider, ...m }))
      );
    
    if (gptModels.length > 0) {
      logger.info("Found GPT models:", { 
        models: gptModels.slice(0, 5).map(m => `${m.provider}: ${m.id}`)
      });
    }
    
    // Find Claude models
    const claudeModels = Object.entries(allModels)
      .flatMap(([provider, models]) => 
        models
          .filter(m => m.id.toLowerCase().includes('claude'))
          .map(m => ({ provider, ...m }))
      );
    
    if (claudeModels.length > 0) {
      logger.info("Found Claude models:", { 
        models: claudeModels.map(m => `${m.provider}: ${m.id}`)
      });
    }
    
    // Find Llama models
    const llamaModels = Object.entries(allModels)
      .flatMap(([provider, models]) => 
        models
          .filter(m => m.id.toLowerCase().includes('llama'))
          .map(m => ({ provider, ...m }))
      );
    
    if (llamaModels.length > 0) {
      logger.info("Found Llama models:", { 
        models: llamaModels.slice(0, 5).map(m => `${m.provider}: ${m.id}`)
      });
    }
    
  } catch (error) {
    logger.error("Failed to analyze model types:", {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Example of using multiple providers for comparison
 */
async function compareProviders() {
  logger.info("🔄 Provider Comparison Demo");

  const question = "What is the capital of France?";
  const availableProviders = getAvailableProviders();

  if (availableProviders.length < 2) {
    logger.warning("Need at least 2 providers for comparison demo");
    return;
  }

  logger.info("Question:", { question });

  for (const provider of availableProviders.slice(0, 3)) {
    // Test max 3 providers
    try {
      const providerName = provider.name.toLowerCase();
      // Use appropriate model for each provider
      const modelName =
        providerName === "openai"
          ? "gpt-4o-mini"
          : providerName === "anthropic"
            ? "claude-3-5-haiku-20241022"
            : providerName === "google"
              ? "gemini-1.5-flash"
            : providerName === "mistral"
              ? "mistral-small-latest"
              : "default-model";
      const model = getModel(providerName, modelName);

      logger.info(`Testing ${provider.name}:`);
      const result = await generateText({
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        model: model as any,
        prompt: question,
        maxTokens: 30,
      });
      logger.success(`${provider.name} response:`, { text: result.text });
    } catch (error) {
      logger.error(`${provider.name} failed:`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

/**
 * Example of dynamic provider selection based on task
 */
async function dynamicProviderSelection() {
  logger.info("🎯 Dynamic Provider Selection Demo");

  const tasks = [
    { task: "Creative writing", preferred: ["openai", "anthropic", "mistral"] },
    { task: "Code generation", preferred: ["groq", "openai", "mistral"] },
    { task: "Analysis", preferred: ["anthropic", "google", "mistral"] },
  ];

  for (const { task, preferred } of tasks) {
    logger.info(`Task: ${task}`);

    // Find the first available preferred provider
    const selectedProvider = preferred.find((name) => hasProvider(name));

    if (selectedProvider) {
      logger.info(`Selected provider: ${selectedProvider}`);
      try {
        // Use appropriate model for the selected provider
        const modelName =
          selectedProvider === "openai"
            ? "gpt-4o-mini"
            : selectedProvider === "anthropic"
              ? "claude-3-5-haiku-20241022"
              : selectedProvider === "mistral"
                ? "mistral-small-latest"
                : selectedProvider === "groq"
                  ? "llama-3.1-8b-instant"
                  : "default-model";
        const model = getModel(selectedProvider, modelName);
        const result = await generateText({
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          model: model as any,
          prompt: `Help with ${task.toLowerCase()}: Write a haiku about programming.`,
          maxTokens: 50,
        });
        logger.success(`${task} result:`, { text: result.text });
      } catch (error) {
        logger.error(`${task} error:`, {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } else {
      logger.warning(`No preferred providers available for ${task}`);
    }
  }
}

// Main execution
async function main() {
  try {
    await demonstrateProvidersRegistry();
    await demonstrateModelFetching();
    await compareProviders();
    await dynamicProviderSelection();
  } catch (error) {
    logger.error("Demo failed:", { error });
  }
}

// Export functions for use in other modules
export {
  demonstrateProvidersRegistry,
  demonstrateModelFetching,
  compareProviders,
  dynamicProviderSelection,
  main,
};

// Run the demo if this file is executed directly
if (import.meta.main) {
  main();
}
