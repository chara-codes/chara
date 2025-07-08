import { chatAgent } from "../src/agents/chat-agent";
import { logger } from "@chara-codes/logger";
import type { CoreMessage } from "ai";
import { hasProvider, fetchModels } from "../src/providers";

/**
 * Example demonstrating how to use the chatAgent with DIAL provider
 */
async function dialAgentExample() {
  logger.info("🚀 DIAL Chat Agent Demo");

  // Check if DIAL provider is available
  if (!hasProvider("dial")) {
    logger.error(
      "DIAL provider is not available. Please check your DIAL_API_KEY and DIAL_API_BASE_URL environment variables."
    );
    process.exit(1);
  }

  logger.info("✅ DIAL provider is available");

  try {
    // Fetch available DIAL models
    logger.info("📋 Fetching available DIAL models...");
    const dialModels = await fetchModels("dial");

    if (dialModels.length === 0) {
      logger.error("No DIAL models found. Exiting.");
      process.exit(1);
    }

    logger.success(`Found ${dialModels.length} DIAL models`);

    // Get available model IDs
    const preferredModels = [
      "anthropic.claude-opus-4-20250514-v1:0",
      "anthropic.claude-sonnet-4-20250514-v1:0",
      "anthropic.claude-3-7-sonnet-20250219-v1:0",
      "o4-mini-2025-04-16",
    ];

    // Find first available preferred model
    const availableModel =
      dialModels.find((m) => preferredModels.includes(m.id)) || dialModels[0];

    if (!availableModel) {
      logger.error("Could not find a suitable model to use. Exiting.");
      process.exit(1);
    }

    const modelId = availableModel.id;
    logger.info(`Using model: ${modelId}`);

    // Basic example
    await runBasicExample(modelId);

    // Multi-turn conversation
    await runConversationExample(modelId);

    // With thinking/reasoning capability
    const thinkingModel = dialModels.find((m) =>
      m.id.includes("with-thinking")
    );
    if (thinkingModel) {
      await runThinkingExample(thinkingModel.id);
    }
  } catch (error) {
    logger.error("Demo failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Example 1: Basic usage with DIAL model
 */
async function runBasicExample(modelId: string) {
  logger.info("💬 Example 1: Basic usage");

  const messages: CoreMessage[] = [
    {
      role: "user",
      content: "Hello, what can you tell me about quantum computing?",
    },
  ];

  const result = await chatAgent({
    model: `dial:::${modelId}`, // Format: provider:::modelId
    messages,
  });

  logger.info("Response:");
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  logger.info("\n✅ Basic example completed");
}

/**
 * Example 2: Multi-turn conversation
 */
async function runConversationExample(modelId: string) {
  logger.info("\n💬 Example 2: Multi-turn conversation");

  const messages: CoreMessage[] = [
    {
      role: "user",
      content: "What are the three most popular programming languages in 2023?",
    },
    {
      role: "assistant",
      content:
        "As of 2023, the three most popular programming languages are:\n\n1. Python - Known for its simplicity, readability, and versatility across data science, AI, web development, and automation.\n\n2. JavaScript - The dominant language for web development, essential for front-end and increasingly popular for back-end through Node.js.\n\n3. Java - Still widely used in enterprise applications, Android development, and large-scale systems for its stability and performance.",
    },
    {
      role: "user",
      content: "What are the main strengths and weaknesses of Python?",
    },
  ];

  const result = await chatAgent({
    model: `dial:::${modelId}`,
    messages,
  });

  logger.info("Response:");
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  logger.info("\n✅ Conversation example completed");
}

/**
 * Example 3: Using a model with thinking/reasoning capabilities
 */
async function runThinkingExample(modelId: string) {
  logger.info("\n🧠 Example 3: Using model with thinking capabilities");
  logger.info(`Using model: ${modelId}`);

  const messages: CoreMessage[] = [
    {
      role: "user",
      content:
        "I need to solve this complex problem: If a recipe calls for 2.5 cups of flour to make 12 cookies, how much flour is needed to make 30 cookies? Please show your reasoning step by step.",
    },
  ];

  const result = await chatAgent({
    model: `dial:::${modelId}`,
    messages,
  });

  logger.info("Response with thinking process:");
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  logger.info("\n✅ Thinking example completed");
}

// Run the demo if this file is executed directly
if (import.meta.main) {
  dialAgentExample().catch(console.error);
}

export {
  dialAgentExample,
  runBasicExample,
  runConversationExample,
  runThinkingExample,
};
