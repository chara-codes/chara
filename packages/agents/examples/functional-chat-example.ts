import { generateId, UIMessage } from "ai";
import {
  appendUserMessage,
  cancelChat,
  createNewChat,
  getActiveChats,
  isProcessing,
  loadChatMessages,
  processChatMessage,
  setMcpTools,
} from "../src/services/chat/chat-processor";
import { logger } from "../src/utils/logger";

/**
 * Example usage of the new functional chat processor with UIMessage format
 * This demonstrates the AI SDK integration pattern from the documentation
 */

async function basicChatExample() {
  console.log("=== Basic Chat Example ===");

  try {
    // Create a new chat
    const chatId = await createNewChat("Basic Chat Example");
    console.log(`Created chat: ${chatId}`);

    // Create user message in UIMessage format
    const userMessage: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [
        {
          type: "text",
          text: "Hello! Can you help me understand how to use TypeScript generics?",
        },
      ],
      createdAt: new Date(),
      metadata: {
        source: "example",
        priority: "normal",
      },
    };

    // Process the chat message
    const response = await processChatMessage({
      chatId,
      messages: [userMessage],
      model: "gpt-4",
      mode: "ask",
      workingDir: process.cwd(),
    });

    console.log("Chat processing started successfully");
    console.log("Response type:", response.constructor.name);
  } catch (error) {
    console.error("Basic chat example failed:", error);
  }
}

async function conversationContinuationExample() {
  console.log("\n=== Conversation Continuation Example ===");

  try {
    // Create a new chat
    const chatId = await createNewChat("Conversation Example");

    // Initial conversation
    const initialMessages: UIMessage[] = [
      {
        id: generateId(),
        role: "user",
        parts: [{ type: "text", text: "What is React?" }],
        createdAt: new Date(),
      },
      {
        id: generateId(),
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "React is a JavaScript library for building user interfaces...",
          },
        ],
        createdAt: new Date(),
      },
    ];

    // Add a follow-up question
    const followUpMessage: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [
        {
          type: "text",
          text: "Can you give me an example of a React component?",
        },
      ],
      createdAt: new Date(),
    };

    // Continue the conversation
    const allMessages = [...initialMessages, followUpMessage];

    const response = await processChatMessage({
      chatId,
      messages: allMessages,
      model: "gpt-4",
      mode: "ask",
    });

    console.log("Conversation continuation processed successfully");
  } catch (error) {
    console.error("Conversation continuation example failed:", error);
  }
}

async function writeModeChatExample() {
  console.log("\n=== Write Mode Chat Example ===");

  try {
    const chatId = await createNewChat("Write Mode Example");

    const codeRequest: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [
        {
          type: "text",
          text: "Create a TypeScript function that validates email addresses and write it to a file",
        },
      ],
      createdAt: new Date(),
      metadata: {
        requestType: "code-generation",
        outputFormat: "typescript",
      },
    };

    // Use write mode for code generation
    const response = await processChatMessage({
      chatId,
      messages: [codeRequest],
      model: "gpt-4",
      mode: "write", // This will trigger git operations
      workingDir: process.cwd(),
    });

    console.log("Write mode chat processed successfully");
  } catch (error) {
    console.error("Write mode chat example failed:", error);
  }
}

async function toolCallExample() {
  console.log("\n=== Tool Call Example ===");

  try {
    // Set up MCP tools
    const mcpTools = {
      searchWeb: {
        name: "search_web",
        description: "Search the web for information",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
          },
          required: ["query"],
        },
      },
    };

    setMcpTools(mcpTools);

    const chatId = await createNewChat("Tool Call Example");

    const toolMessage: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [
        {
          type: "text",
          text: "Search for the latest TypeScript news and summarize the findings",
        },
      ],
      createdAt: new Date(),
    };

    const response = await processChatMessage({
      chatId,
      messages: [toolMessage],
      model: "gpt-4",
      mode: "ask",
    });

    console.log("Tool call example processed successfully");
  } catch (error) {
    console.error("Tool call example failed:", error);
  }
}

async function chatManagementExample() {
  console.log("\n=== Chat Management Example ===");

  try {
    // Create multiple chats
    const chat1 = await createNewChat("Chat 1");
    const chat2 = await createNewChat("Chat 2");

    console.log(`Created chats: ${chat1}, ${chat2}`);

    // Start processing in both chats (simulate concurrent processing)
    const message1: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [{ type: "text", text: "Explain JavaScript closures" }],
      createdAt: new Date(),
    };

    const message2: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [{ type: "text", text: "What are TypeScript decorators?" }],
      createdAt: new Date(),
    };

    // Start both processes (don't await yet)
    const process1 = processChatMessage({
      chatId: chat1,
      messages: [message1],
      model: "gpt-4",
      mode: "ask",
    });

    const process2 = processChatMessage({
      chatId: chat2,
      messages: [message2],
      model: "gpt-4",
      mode: "ask",
    });

    // Check active chats
    console.log("Active chats:", getActiveChats());
    console.log(`Chat 1 processing: ${isProcessing(chat1)}`);
    console.log(`Chat 2 processing: ${isProcessing(chat2)}`);

    // Cancel one chat
    setTimeout(() => {
      console.log(`Cancelling chat: ${chat2}`);
      cancelChat(chat2);
    }, 1000);

    // Wait for completion
    await Promise.allSettled([process1, process2]);

    console.log("Chat management example completed");
  } catch (error) {
    console.error("Chat management example failed:", error);
  }
}

async function loadAndContinueExample() {
  console.log("\n=== Load and Continue Example ===");

  try {
    // Create chat and add initial message
    const chatId = await createNewChat("Load and Continue Example");

    // Add a user message using utility function
    await appendUserMessage(
      chatId,
      "What is the difference between let and const in JavaScript?"
    );

    // Load existing messages
    const existingMessages = await loadChatMessages(chatId);
    console.log(`Loaded ${existingMessages.length} existing messages`);

    // Add another message to continue the conversation
    const newMessage: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [
        { type: "text", text: "Can you provide code examples for each?" },
      ],
      createdAt: new Date(),
    };

    const allMessages = [...existingMessages, newMessage];

    const response = await processChatMessage({
      chatId,
      messages: allMessages,
      model: "gpt-4",
      mode: "ask",
    });

    console.log("Load and continue example processed successfully");
  } catch (error) {
    console.error("Load and continue example failed:", error);
  }
}

async function errorHandlingExample() {
  console.log("\n=== Error Handling Example ===");

  try {
    // Test with invalid input
    const invalidChatId = "non-existent-chat";

    const message: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [{ type: "text", text: "This should handle errors gracefully" }],
      createdAt: new Date(),
    };

    try {
      await processChatMessage({
        chatId: invalidChatId,
        messages: [message],
        model: "invalid-model",
        mode: "ask",
      });
    } catch (error) {
      console.log(
        "Expected error caught:",
        error instanceof Error ? error.message : error
      );
    }

    // Test cancellation
    const validChatId = await createNewChat("Error Handling Test");
    const abortController = new AbortController();

    // Cancel immediately
    setTimeout(() => abortController.abort(), 100);

    try {
      await processChatMessage({
        chatId: validChatId,
        messages: [message],
        model: "gpt-4",
        mode: "ask",
        abortSignal: abortController.signal,
      });
    } catch (error) {
      console.log(
        "Cancellation error caught:",
        error instanceof Error ? error.message : error
      );
    }

    console.log("Error handling example completed");
  } catch (error) {
    console.error("Error handling example failed:", error);
  }
}

async function metadataExample() {
  console.log("\n=== Metadata Example ===");

  try {
    const chatId = await createNewChat("Metadata Example");

    // Message with rich metadata
    const messageWithMetadata: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [
        {
          type: "text",
          text: "Explain the SOLID principles in software development",
        },
      ],
      createdAt: new Date(),
      metadata: {
        source: "learning-platform",
        category: "software-engineering",
        difficulty: "intermediate",
        estimatedTokens: 150,
        priority: "high",
        tags: ["solid", "principles", "design-patterns"],
        userContext: {
          experience: "intermediate",
          previousTopics: ["oop", "design-patterns"],
        },
      },
    };

    const response = await processChatMessage({
      chatId,
      messages: [messageWithMetadata],
      model: "gpt-4",
      mode: "ask",
    });

    console.log("Metadata example processed successfully");
  } catch (error) {
    console.error("Metadata example failed:", error);
  }
}

// Main execution function
async function runAllExamples() {
  console.log("🚀 Running Functional Chat Processor Examples\n");

  await basicChatExample();
  await conversationContinuationExample();
  await writeModeChatExample();
  await toolCallExample();
  await chatManagementExample();
  await loadAndContinueExample();
  await errorHandlingExample();
  await metadataExample();

  console.log("\n✅ All examples completed!");
}

// Export individual examples for testing
export {
  basicChatExample,
  conversationContinuationExample,
  writeModeChatExample,
  toolCallExample,
  chatManagementExample,
  loadAndContinueExample,
  errorHandlingExample,
  metadataExample,
  runAllExamples,
};

// Run examples if this file is executed directly
if (import.meta.main) {
  runAllExamples().catch((error) => {
    console.error("Failed to run examples:", error);
    process.exit(1);
  });
}

/**
 * Example of creating a custom chat transport for client-side usage
 * This demonstrates how to integrate with the AI SDK's useChat hook
 */
export const customChatTransportExample = {
  // This would be used on the client side
  clientConfiguration: {
    api: "/api/chat",
    prepareRequestBody: ({
      messages,
      chatId,
    }: {
      messages: UIMessage[];
      chatId?: string;
    }) => {
      // Send only the last message to optimize payload
      return {
        chatId,
        message: messages[messages.length - 1],
        model: "gpt-4",
        mode: "ask",
      };
    },
  },

  // Server-side handler example
  serverHandler: async (request: Request) => {
    const { chatId, message, model, mode } = await request.json();

    // Load previous messages if chatId exists
    const previousMessages = chatId ? await loadChatMessages(chatId) : [];

    // Append the new message
    const allMessages = [...previousMessages, message];

    // Process with the functional processor
    return processChatMessage({
      chatId: chatId || (await createNewChat("New Chat")),
      messages: allMessages,
      model,
      mode,
    });
  },
};
