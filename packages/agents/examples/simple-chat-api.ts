import { generateId, type UIMessage } from "ai";
import { logger } from "../src/utils/logger";

/**
 * Simple example demonstrating how to use the /api/chat endpoint
 */

const API_BASE_URL = "http://localhost:3031";

async function simpleChatExample() {
  try {
    logger.info("🚀 Simple Chat API Example");

    // Create a unique chat ID
    const chatId = generateId();

    // Create a user message
    const userMessage: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [
        {
          type: "text",
          text: "Hello! Please explain what TypeScript is in simple terms.",
        },
      ],
    };

    // Prepare the request payload
    const payload = {
      chatId,
      messages: [userMessage],
      model: "openai:::gpt-4o-mini",
      mode: "ask",
    };

    // Send the request
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/plain",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    // Read the streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response stream available");
    }

    logger.info("\n📝 AI Response:");
    logger.info("-".repeat(50));

    let fullResponse = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      fullResponse += chunk;
      process.stdout.write(chunk);
    }

    logger.info("\n" + "-".repeat(50));
    logger.info("✅ Chat completed successfully!");

    return { chatId, response: fullResponse };
  } catch (error) {
    logger.error("❌ Error:", error);
    throw error;
  }
}

async function writeModeChatExample() {
  try {
    logger.info("\n🔧 Write Mode Chat API Example");

    const chatId = generateId();

    const userMessage: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [
        {
          type: "text",
          text: "Create a simple 'hello.js' file that logs 'Hello, World!' to the console.",
        },
      ],
    };

    const payload = {
      chatId,
      messages: [userMessage],
      model: "openai:::gpt-4o-mini",
      mode: "write", // This enables file operations
    };

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/plain",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response stream available");
    }

    logger.info("\n📝 AI Response (with file creation):");
    logger.info("-".repeat(50));

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      process.stdout.write(chunk);
    }

    logger.info("\n" + "-".repeat(50));
    logger.info("✅ Write mode chat completed! Check for created files.");
  } catch (error) {
    logger.error("❌ Error:", error);
    throw error;
  }
}

async function loadChatExample() {
  try {
    logger.info("\n📖 Load Chat Messages Example");

    const chatId = "example-chat-id";

    const response = await fetch(`${API_BASE_URL}/api/chat?chatId=${chatId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const result = await response.json();
      logger.info(
        `✅ Found ${result.messages?.length || 0} messages for chat ${chatId}`
      );
    } else {
      logger.info(
        `ℹ️  No messages found for chat ${chatId} (this is expected for new chat IDs)`
      );
    }
  } catch (error) {
    logger.error("❌ Error loading chat:", error);
  }
}

// Helper function to create a user message
export function createUserMessage(text: string): UIMessage {
  return {
    id: generateId(),
    role: "user",
    parts: [{ type: "text", text }],
  };
}

async function main() {
  logger.info("🧪 Running Simple Chat API Examples\n");

  try {
    // Test basic chat functionality
    await simpleChatExample();

    // Test write mode (file operations)
    await writeModeChatExample();

    // Test loading chat messages
    await loadChatExample();

    logger.info("\n🎉 All examples completed successfully!");
  } catch (error) {
    logger.error("\n💥 Examples failed:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { simpleChatExample, writeModeChatExample, loadChatExample };
