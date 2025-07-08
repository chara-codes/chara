import { logger } from "@chara-codes/logger";
import { generateText, streamText, type CoreMessage } from "ai";
import { getModel, hasProvider, fetchModels } from "../src/providers";

/**
 * Example demonstrating how to use the DIAL provider
 */
async function demonstrateDIAL() {
  logger.info("🚀 DIAL Provider Demo");
  logger.info("Base URL:", process.env.DIAL_API_BASE_URL);
  // Check if DIAL provider is available
  if (!hasProvider("dial")) {
    logger.error(
      "DIAL provider is not available. Please check your DIAL_API_KEY and DIAL_API_BASE_URL environment variables."
    );
    process.exit(1);
  }

  logger.info("✅ DIAL provider is available");

  try {
    // 1. Fetch available DIAL models
    logger.info("📋 Fetching available DIAL models...");
    const dialModels = await fetchModels("dial");

    if (dialModels.length > 0) {
      logger.success(`Found ${dialModels.length} DIAL models:`, {
        models: dialModels.map((m) => ({
          id: m.id,
          name: m.name || m.id,
        })),
      });
    } else {
      logger.warning("No DIAL models found");
    }

    // 2. Demonstrate text generation with DIAL
    // Using some common DIAL models
    const dialModelIds = [
      "o4-mini-2025-04-16",
      "anthropic.claude-opus-4-20250514-v1:0",
      "anthropic.claude-sonnet-4-20250514-v1:0",
      "anthropic.claude-3-7-sonnet-20250219-v1:0",
      "o3-2025-04-16",
    ];

    // Find first available model from the list
    const availableModelId = "deepseek-r1";
    // dialModels.find((m) => dialModelIds.includes(m.id))?.id ||
    // dialModels[0]?.id;

    if (!availableModelId) {
      logger.error("No DIAL models available for testing");
      return;
    }

    logger.info(`📝 Testing DIAL with model: ${availableModelId}`);

    // 3. Basic text generation
    logger.info("🤖 Testing basic text generation:", availableModelId);
    const prompt = "Explain quantum computing in simple terms.";
    const model = getModel("dial", availableModelId);
    logger.dump(model);
    const startTime = Date.now();
    const response = await generateText({
      model,
      prompt,
      maxTokens: 150,
    });
    const duration = Date.now() - startTime;

    logger.success(`Response received in ${duration}ms:`, {
      text: response.text,
      usage: response.usage,
    });

    // 4. Streaming example
    logger.info("🌊 Testing streaming response:");
    const streamPrompt = "Count from 1 to 5, explaining each number briefly.";

    logger.info(`Streaming prompt: "${streamPrompt}"`);
    const stream = await streamText({
      model,
      prompt: streamPrompt,
      maxTokens: 200,
    });

    logger.info("Streaming response:");
    let streamedText = "";
    for await (const chunk of stream.textStream) {
      process.stdout.write(chunk);
      streamedText += chunk;
    }
    logger.info("\n✅ Streaming completed.");

    // 5. Multi-turn conversation example
    logger.info("💬 Testing multi-turn conversation:");
    const messages: CoreMessage[] = [
      { role: "user", content: "What's the capital of France?" },
      { role: "assistant", content: "The capital of France is Paris." },
      { role: "user", content: "What's its population?" },
    ];

    logger.info("Conversation history:", {
      messages: messages.map((m) => ({
        role: m.role,
        content:
          typeof m.content === "string"
            ? m.content.substring(0, 50)
            : JSON.stringify(m.content).substring(0, 50),
      })),
    });

    const conversationResult = await streamText({
      model,
      messages,
      maxTokens: 150,
    });

    logger.info("Conversation response:");
    let conversationResponse = "";
    for await (const chunk of conversationResult.textStream) {
      process.stdout.write(chunk);
      conversationResponse += chunk;
    }
    logger.info("\n✅ Conversation completed.");

    // 6. Advanced prompt with thinking/reasoning
    if (dialModels.some((m) => m.id.includes("with-thinking"))) {
      logger.info("🧠 Testing model with thinking/reasoning capabilities:");
      const thinkingModelId = dialModels.find((m) =>
        m.id.includes("with-thinking")
      )?.id;

      if (thinkingModelId) {
        const thinkingModel = getModel("dial", thinkingModelId);
        const thinkingPrompt =
          "Solve this step-by-step: If 5 apples cost $2.50, how much would 8 apples cost?";

        logger.info(`Using model: ${thinkingModelId}`);
        logger.info(`Prompt: "${thinkingPrompt}"`);

        const thinkingResult = await streamText({
          model: thinkingModel,
          prompt: thinkingPrompt,
          maxTokens: 300,
        });

        logger.info("Response with thinking:");
        for await (const chunk of thinkingResult.textStream) {
          process.stdout.write(chunk);
        }
        logger.info("\n✅ Thinking example completed.");
      } else {
        logger.warning("No thinking-enabled models found");
      }
    }
  } catch (error) {
    logger.error("Demo failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  logger.info("✨ DIAL demo completed");
}

// Run the demo if this file is executed directly
if (import.meta.main) {
  demonstrateDIAL().catch(console.error);
}

// Export functions for use in other modules
export { demonstrateDIAL };
