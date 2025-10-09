#!/usr/bin/env bun
import { startUI } from "./index.js";

// Demo script to test the CLI UI components
const runDemo = async () => {
  console.log("🚀 Starting Chara CLI UI Demo...\n");

  let messageCount = 0;
  const messages: Array<{
    id: string;
    content: string;
    sender: "user" | "assistant";
    timestamp: Date;
  }> = [];

  const ui = startUI({
    onMessageSubmit: (message: string) => {
      messageCount++;
      console.log(`📝 User message #${messageCount}:`, message);

      // Add user message to history
      messages.push({
        id: `user-${messageCount}`,
        content: message,
        sender: "user",
        timestamp: new Date(),
      });

      // Show loading state
      ui.rerender({
        onMessageSubmit: handleMessageSubmit,
        onChatSelect: handleChatSelect,
        isLoading: true,
        currentFolder: "./demo-project",
        currentModel: "gpt-4-turbo",
      });

      // Simulate AI response after delay
      setTimeout(() => {
        const responses = [
          "I understand you'd like help with that. Let me analyze your request...",
          "That's a great question! Here's what I think...",
          "I can help you with that. Let me break it down step by step...",
          "Interesting! Let me provide some guidance on this topic...",
          "I see what you're trying to accomplish. Here's my recommendation...",
        ];

        const randomResponse =
          responses[Math.floor(Math.random() * responses.length)];

        messages.push({
          id: `assistant-${messageCount}`,
          content: randomResponse,
          sender: "assistant",
          timestamp: new Date(),
        });

        console.log(`🤖 Assistant response #${messageCount}:`, randomResponse);

        ui.rerender({
          onMessageSubmit: handleMessageSubmit,
          onChatSelect: handleChatSelect,
          isLoading: false,
          currentFolder: "./demo-project",
          currentModel: "gpt-4-turbo",
        });
      }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5 seconds
    },

    onChatSelect: (chatId: string) => {
      console.log(`💬 User selected chat: ${chatId}`);
    },

    isLoading: false,
    currentFolder: "./demo-project",
    currentModel: "gpt-4-turbo",
  });

  const handleMessageSubmit = (message: string) => {
    messageCount++;
    console.log(`📝 User message #${messageCount}:`, message);

    // Show loading state
    ui.rerender({
      onMessageSubmit: handleMessageSubmit,
      onChatSelect: handleChatSelect,
      isLoading: true,
      currentFolder: "./demo-project",
      currentModel: "gpt-4-turbo",
    });

    // Simulate processing
    setTimeout(() => {
      const responses = [
        "Great! I've processed your request. Here's what I found...",
        "That's an excellent point! Let me elaborate on that...",
        "I can definitely help with that. Here's my approach...",
        "Thanks for the clarification! Based on what you've shared...",
        "Perfect! Let me walk you through the solution...",
      ];

      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];
      console.log(`🤖 Assistant response #${messageCount}:`, randomResponse);

      ui.rerender({
        onMessageSubmit: handleMessageSubmit,
        onChatSelect: handleChatSelect,
        isLoading: false,
        currentFolder: "./demo-project",
        currentModel: "gpt-4-turbo",
      });
    }, 1200 + Math.random() * 800);
  };

  const handleChatSelect = (chatId: string) => {
    console.log(`💬 Loading chat: ${chatId}`);
    // Here you could load different conversation history
  };

  // Display helpful information
  console.log("📋 Demo Instructions:");
  console.log("  • Type messages in the text input and press Enter");
  console.log("  • The UI will simulate AI responses with loading states");
  console.log("  • Use Ctrl+C to exit gracefully");
  console.log("  • All interactions are logged to the console");
  console.log(
    '\n🎯 Try typing: "Hello", "Help me with React", "What can you do?"'
  );
  console.log("─".repeat(60));

  // Handle graceful shutdown
  const shutdown = () => {
    console.log("\n🛑 Shutting down Chara CLI UI Demo...");
    console.log(`📊 Demo Stats: ${messageCount} messages exchanged`);
    ui.unmount();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Auto-exit after 5 minutes to prevent hanging processes
  setTimeout(() => {
    console.log("\n⏰ Demo timeout reached (5 minutes). Shutting down...");
    shutdown();
  }, 5 * 60 * 1000);
};

// Run the demo if this file is executed directly
if (import.meta.main) {
  runDemo().catch((error) => {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  });
}

export default runDemo;
