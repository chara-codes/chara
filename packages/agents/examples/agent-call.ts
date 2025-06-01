import { chatAgent } from "../src/agents/chat-agent";
import type { CoreMessage } from "ai";

/**
 * Example 1: Basic usage with default OpenAI model
 */
async function basicExample() {
  const messages: CoreMessage[] = [
    { role: "user", content: "Hello, how are you today?" },
  ];

  const result = chatAgent({
    model: "ollama:::qwen3", // or just "gpt-4o-mini" since openai is default
    messages,
  });

  // Handle the streaming response
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
}

/**
 * Example 2: Using a different model provider
 */
async function differentProviderExample() {
  const messages: CoreMessage[] = [
    { role: "user", content: "Tell me a joke about programming" },
  ];

  const result = await chatAgent({
    model: "ollama:::qwen3", // Different provider
    messages,
  });

  // Collect the full response
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
}

/**
 * Example 3: Multi-turn conversation
 */
async function conversationExample() {
  const messages: CoreMessage[] = [
    { role: "user", content: "What's the weather like?" },
    {
      role: "assistant",
      content:
        "I don't have access to real-time weather data, but I can help you think about weather-related topics!",
    },
    {
      role: "user",
      content: "That's okay, just tell me about different types of clouds",
    },
  ];

  const result = await chatAgent({
    model: "openai:::gpt-4o",
    messages,
  });

  // Process chunks as they arrive
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
  console.log("\n--- End of response ---");
}

/**
 * Example 4: Error handling
 */
async function errorHandlingExample() {
  try {
    const messages: CoreMessage[] = [
      { role: "user", content: "Help me solve this math problem: 2 + 2" },
    ];

    const result = await chatAgent({
      model: "invalid-provider:::invalid-model",
      messages,
    });

    await result.text;
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

/**
 * Example 5: Using system message through the agent (note: agent adds its own system message)
 */
async function systemMessageExample() {
  const messages: CoreMessage[] = [
    { role: "user", content: "Explain quantum computing in simple terms" },
  ];

  const result = await chatAgent({
    model: "openai:::gpt-4o-mini",
    messages,
  });

  // The agent will combine the built-in system message ("Be funny") with the user's message
  const response = await result.text;
  console.log("Response with funny system prompt:", response);
}

/**
 * Example 6: Streaming with custom processing
 */
async function customStreamingExample() {
  const messages: CoreMessage[] = [
    {
      role: "user",
      content: "Write a short story about a robot learning to paint",
    },
  ];

  const result = await chatAgent({
    model: "openai:::gpt-4o",
    messages,
  });

  let wordCount = 0;
  let buffer = "";

  for await (const chunk of result.textStream) {
    buffer += chunk;
    const words = buffer.split(/\s+/).filter((word) => word.length > 0);

    if (words.length > wordCount) {
      wordCount = words.length;
      process.stdout.write(chunk);

      // Show progress every 10 words
      if (wordCount % 10 === 0) {
        process.stdout.write(`\n[Word count: ${wordCount}]\n`);
      }
    }
  }
}

// Run examples
async function runExamples() {
  console.log("=== Basic Example ===");
  await basicExample();

  console.log("\n\n=== Different Provider Example ===");
  await differentProviderExample();

  console.log("\n\n=== Conversation Example ===");
  await conversationExample();

  // console.log("\n\n=== Error Handling Example ===");
  // await errorHandlingExample();

  // console.log("\n\n=== System Message Example ===");
  // await systemMessageExample();

  console.log("\n\n=== Custom Streaming Example ===");
  await customStreamingExample();
}

// Uncomment to run the examples
// runExamples().catch(console.error);

basicExample();

export {
  basicExample,
  differentProviderExample,
  conversationExample,
  errorHandlingExample,
  systemMessageExample,
  customStreamingExample,
};
