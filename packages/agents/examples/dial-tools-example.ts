import { logger } from "@apk/logger";
import { streamText, type CoreMessage } from "ai";
import { getModel, hasProvider, fetchModels } from "../src/providers";

/**
 * Example demonstrating how to use DIAL models with the AI SDK
 */
async function dialWithToolsExample() {
  logger.info("🚀 DIAL Models Demo");

  // Check if DIAL provider is available
  if (!hasProvider("dial")) {
    logger.error(
      "DIAL provider is not available. Please check your DIAL_API_KEY and DIAL_API_BASE_URL environment variables.",
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

    // Get available model IDs
    const preferredModels = [
      "anthropic.claude-opus-4-20250514-v1:0",
      "anthropic.claude-sonnet-4-20250514-v1:0",
      "anthropic.claude-3-7-sonnet-20250219-v1:0",
      "o4-mini-2025-04-16",
    ];

    // Find first available preferred model
    const availableModel = dialModels.find((m) =>
      preferredModels.includes(m.id)
    ) || dialModels[0];
    
    if (!availableModel) {
      logger.error("Could not find a suitable model to use. Exiting.");
      process.exit(1);
    }

    const modelId = availableModel.id;
    logger.info(`Using model: ${modelId}`);

    // Run the examples
    await runSimpleExample(modelId);
    await runSystemPromptExample(modelId);
    await runJsonExample(modelId);
  } catch (error) {
    logger.error("Demo failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  logger.info("✨ DIAL examples completed");
}

/**
 * Example 1: Simple prompt with DIAL model
 */
async function runSimpleExample(modelId: string) {
  logger.info("💬 Example 1: Simple Prompt");

  const messages: CoreMessage[] = [
    { role: "user", content: "What's the capital of Japan, and what are three interesting facts about it?" },
  ];

  const model = getModel("dial", modelId);

  logger.info("Sending request to DIAL...");
  const result = await streamText({
    model,
    messages,
    maxTokens: 500,
  });

  logger.info("Response:");
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
  
  logger.info("\n✅ Simple example completed");
}

/**
 * Example 2: Using a system prompt to guide the model
 */
async function runSystemPromptExample(modelId: string) {
  logger.info("\n🧠 Example 2: Using System Prompt");

  const messages: CoreMessage[] = [
    {
      role: "system",
      content: 
        "You are a helpful math tutor who explains concepts step by step. " +
        "Always format mathematical expressions clearly and provide visual explanations when possible."
    },
    { role: "user", content: "Can you explain how to solve the quadratic equation 2x² - 5x + 2 = 0?" }
  ];

  const model = getModel("dial", modelId);

  logger.info("Sending request with system prompt...");
  const result = await streamText({
    model,
    messages,
    maxTokens: 800,
  });

  logger.info("Response with system prompt guidance:");
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
  
  logger.info("\n✅ System prompt example completed");
}

/**
 * Example 3: Structured output - requesting JSON response
 */
async function runJsonExample(modelId: string) {
  logger.info("\n📊 Example 3: Structured JSON Output");

  const messages: CoreMessage[] = [
    {
      role: "system",
      content: "You are a helpful assistant that always responds in JSON format."
    },
    { 
      role: "user", 
      content: "Please provide a list of 3 popular programming languages and their main use cases. Return as a JSON array." 
    }
  ];

  const model = getModel("dial", modelId);

  logger.info("Requesting JSON response...");
  const result = await streamText({
    model,
    messages,
    maxTokens: 600,
  });

  logger.info("JSON response:");
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
  
  logger.info("\n✅ JSON example completed");
}

// Run the demo if this file is executed directly
if (import.meta.main) {
  dialWithToolsExample().catch(console.error);
}

export { dialWithToolsExample, runSimpleExample, runSystemPromptExample, runJsonExample };