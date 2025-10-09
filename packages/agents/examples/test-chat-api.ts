import { generateId, type UIMessage } from "ai";
import { logger } from "../src/utils/logger";

/**
 * Example script to test the /api/chat endpoint
 * This demonstrates how to use the chat API with streaming responses
 */

const API_BASE_URL = "http://localhost:3031";

async function testChatAPI() {
  try {
    logger.info("🧪 Testing Chat API endpoint...");

    // Create a new chat ID
    const chatId = generateId();
    logger.info(`Using chat ID: ${chatId}`);

    // Create user message in UIMessage format
    const userMessage: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [
        {
          type: "text",
          text: "Hello! Can you help me understand how TypeScript generics work? Please provide a simple example.",
        },
      ],
      metadata: {
        source: "example",
        priority: "normal",
      },
    };

    const payload = {
      chatId,
      messages: [userMessage],
      model: "openai:::gpt-4o-mini",
      mode: "ask",
    };

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/plain", // For streaming response
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`
      );
    }

    logger.info("✅ API call successful, processing streaming response...");

    // Handle streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body reader available");
    }

    let fullResponse = "";
    logger.info("\n📝 Streaming response:");
    logger.info("═".repeat(60));

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        fullResponse += chunk;
        process.stdout.write(chunk); // Stream output in real-time
      }
    } finally {
      reader.releaseLock();
    }

    logger.info("\n═".repeat(60));
    logger.info("🎉 Chat response completed successfully!");

    return { chatId, fullResponse };
  } catch (error) {
    logger.error("❌ Chat API test failed:", error);
    throw error;
  }
}

async function testContinuedConversation() {
  try {
    logger.info("\n🧪 Testing continued conversation...");

    // Use the same chat ID for continuation
    const chatId = generateId();

    // Initial conversation
    const initialMessages: UIMessage[] = [
      {
        id: generateId(),
        role: "user",
        parts: [{ type: "text", text: "What is React?" }],
      },
      {
        id: generateId(),
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "React is a JavaScript library for building user interfaces, developed by Facebook. It allows developers to create reusable UI components and manage application state efficiently.",
          },
        ],
      },
    ];

    // Add follow-up question
    const followUpMessage: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [
        {
          type: "text",
          text: "Can you show me a simple React component example?",
        },
      ],
    };

    const allMessages = [...initialMessages, followUpMessage];

    const payload = {
      chatId,
      messages: allMessages,
      model: "openai:::gpt-4o-mini",
      mode: "ask",
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
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`
      );
    }

    logger.info("✅ Continued conversation API call successful");
    logger.info("\n📝 Follow-up response:");
    logger.info("═".repeat(60));

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body reader available");
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        process.stdout.write(chunk);
      }
    } finally {
      reader.releaseLock();
    }

    logger.info("\n═".repeat(60));
    logger.info("🎉 Continued conversation completed!");
  } catch (error) {
    logger.error("❌ Continued conversation test failed:", error);
    throw error;
  }
}

async function testWriteMode() {
  try {
    logger.info("\n🧪 Testing write mode...");

    const chatId = generateId();

    const userMessage: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [
        {
          type: "text",
          text: "Create a simple TypeScript function that calculates the factorial of a number. Save it to a file called factorial.ts",
        },
      ],
    };

    const payload = {
      chatId,
      messages: [userMessage],
      model: "openai:::gpt-4o-mini",
      mode: "write", // Using write mode for file operations
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
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`
      );
    }

    logger.info("✅ Write mode API call successful");
    logger.info("\n📝 Write mode response:");
    logger.info("═".repeat(60));

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body reader available");
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        process.stdout.write(chunk);
      }
    } finally {
      reader.releaseLock();
    }

    logger.info("\n═".repeat(60));
    logger.info("🎉 Write mode completed! Check for created files.");
  } catch (error) {
    logger.error("❌ Write mode test failed:", error);
    throw error;
  }
}

async function testLoadChatMessages() {
  try {
    logger.info("\n🧪 Testing load chat messages (GET)...");

    const chatId = "test-chat-id"; // Use a known chat ID or one from previous tests

    const response = await fetch(`${API_BASE_URL}/api/chat?chatId=${chatId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      logger.info(
        `ℹ️  Expected failure for non-existent chat: ${response.status}`
      );
      return;
    }

    const result = await response.json();
    logger.info("✅ Load messages successful");
    logger.info(`📋 Chat ID: ${result.chatId}`);
    logger.info(`📋 Messages count: ${result.messages?.length || 0}`);

    if (result.messages && result.messages.length > 0) {
      logger.info("\n📝 First message:");
      logger.info(JSON.stringify(result.messages[0], null, 2));
    }
  } catch (error) {
    logger.error("❌ Load messages test failed:", error);
    // Don't throw here as this test might fail if no chat exists
  }
}

async function testCORSHeaders() {
  try {
    logger.info("\n🧪 Testing CORS preflight request...");

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "OPTIONS",
    });

    if (!response.ok) {
      throw new Error(`CORS preflight failed! status: ${response.status}`);
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": response.headers.get(
        "Access-Control-Allow-Origin"
      ),
      "Access-Control-Allow-Methods": response.headers.get(
        "Access-Control-Allow-Methods"
      ),
      "Access-Control-Allow-Headers": response.headers.get(
        "Access-Control-Allow-Headers"
      ),
    };

    logger.info("✅ CORS headers:", corsHeaders);
  } catch (error) {
    logger.error("❌ CORS test failed:", error);
    throw error;
  }
}

async function testErrorHandling() {
  try {
    logger.info("\n🧪 Testing error handling...");

    // Test missing required fields
    const invalidPayload = {
      chatId: "test",
      // Missing messages, model, mode
    };

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invalidPayload),
    });

    if (response.ok) {
      throw new Error("Expected error response for invalid payload");
    }

    const errorResult = await response.json();
    logger.info("✅ Error handling works correctly");
    logger.info(`📋 Error message: ${errorResult.error}`);
    logger.info(`📋 Status code: ${response.status}`);
  } catch (error) {
    logger.error("❌ Error handling test failed:", error);
    throw error;
  }
}

async function main() {
  logger.info("🚀 Starting Chat API tests...");
  logger.info(`📡 API Base URL: ${API_BASE_URL}`);

  try {
    await testCORSHeaders();
    await testErrorHandling();
    await testChatAPI();
    await testContinuedConversation();
    await testWriteMode();
    await testLoadChatMessages();

    logger.info("\n🎉 All Chat API tests completed successfully!");
  } catch (error) {
    logger.error("\n💥 Chat API test suite failed:", error);
    process.exit(1);
  }
}

// Helper function to create a simple UIMessage
export function createUserMessage(
  text: string,
  metadata?: Record<string, unknown>
): UIMessage {
  return {
    id: generateId(),
    role: "user",
    parts: [{ type: "text", text }],

    ...(metadata && { metadata }),
  };
}

// Helper function to create assistant message (for conversation continuation)
export function createAssistantMessage(
  text: string,
  metadata?: Record<string, unknown>
): UIMessage {
  return {
    id: generateId(),
    role: "assistant",
    parts: [{ type: "text", text }],

    ...(metadata && { metadata }),
  };
}

if (import.meta.main) {
  main();
}

export {
  testChatAPI,
  testContinuedConversation,
  testWriteMode,
  testLoadChatMessages,
  testCORSHeaders,
  testErrorHandling,
};
