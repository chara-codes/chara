import { generateText, streamText, type LanguageModelV1 } from "ai";
import { getModel, hasProvider } from "../src/providers";
import { logger } from "../src/utils/logger";

async function demonstrateOpenRouterUsage() {
  logger.info("🚀 OpenRouter Usage Demo");

  // Check if OpenRouter is available
  // Note: "openrouter" is the correct provider name
  if (!hasProvider("openrouter")) {
    logger.error(
      "OpenRouter provider is not available. Please check your OPEN_ROUTER_API_KEY environment variable."
    );
    process.exit(1);
  }

  logger.info("✅ OpenRouter provider is available");

  const prompt = "Write a haiku about programming";

  // Test different OpenRouter models
  const modelsToTest = [
    {
      id: "anthropic/claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
      description: "High-quality reasoning model",
    },
    {
      // Note: "openai" and "GPT" are correct model names
      id: "openai/gpt-4o-mini",
      name: "GPT-4o Mini",
      description: "Fast and cost-effective",
    },
    {
      id: "meta-llama/llama-3.1-8b-instruct",
      name: "Llama 3.1 8B",
      description: "Open-source model",
    },
    {
      id: "google/gemini-pro-1.5",
      name: "Gemini Pro 1.5",
      description: "Large context window",
    },
  ];

  logger.info(`📝 Testing prompt: "${prompt}"`);
  logger.info("🤖 Testing different OpenRouter models:");

  for (const modelConfig of modelsToTest) {
    try {
      logger.info(`\n🔍 Testing ${modelConfig.name} (${modelConfig.id})`);
      logger.info(`   ${modelConfig.description}`);

      const model = getModel("openrouter", modelConfig.id) as LanguageModelV1;

      const startTime = Date.now();
      const result = await generateText({
        model,
        prompt,
        maxOutputTokens: 100,
      });
      const duration = Date.now() - startTime;

      logger.info(`✅ Response (${duration}ms):`);
      logger.info(`   ${result.text.text}`);
      logger.info(`   Tokens: ${result.usage?.totalTokens || "unknown"}`);
    } catch (error) {
      logger.error(`❌ Failed to test ${modelConfig.name}:`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Test streaming with OpenRouter
  logger.info("\n🌊 Testing streaming with Claude 3.5 Sonnet:");
  try {
    // Cast model to proper type
    const model = getModel(
      "openrouter",
      "anthropic/claude-3.5-sonnet"
    ) as LanguageModelV1;

    const { textStream } = streamText({
      model,
      prompt: "Count from 1 to 5, explaining each number briefly",
      maxOutputTokens: 200,
    });

    let fullResponse = "";
    for await (const textPart of textStream) {
      process.stdout.write(textPart);
      fullResponse += textPart;
    }

    logger.info(
      `\n✅ Streaming completed. Total length: ${fullResponse.length} characters`
    );
  } catch (error) {
    logger.error("❌ Streaming test failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test free models
  // Note: "deepseek" is a correct model name
  logger.info("\n💰 Testing free model (DeepSeek R1):");
  try {
    // Cast model to proper type
    const model = getModel(
      "openrouter",
      "deepseek/deepseek-r1-0528:free"
    ) as LanguageModelV1;

    const result = await generateText({
      model,
      prompt: "Explain quantum computing in one sentence",
      maxOutputTokens: 50,
    });

    logger.info("✅ Free model response:");
    logger.info(`   ${result.text.text}`);
  } catch (error) {
    logger.error("❌ Free model test failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test error handling
  logger.info("\n🚫 Testing error handling with invalid model:");
  try {
    // Cast model to proper type
    const model = getModel(
      "openrouter",
      "invalid/model-name"
    ) as LanguageModelV1;

    await generateText({
      model,
      prompt: "This should fail",
      maxOutputTokens: 10,
    });
  } catch (error) {
    logger.info("✅ Correctly caught error for invalid model:");
    logger.info(
      `   ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  logger.info("\n✨ OpenRouter usage demo completed!");
}

// Run the demo
demonstrateOpenRouterUsage().catch(console.error);
