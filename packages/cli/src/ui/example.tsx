import React from "react";
import { startUI } from "./index.js";

// Example usage of the CLI UI
const runExample = () => {
  console.log("Starting Chara CLI UI...");

  const ui = startUI({
    onMessageSubmit: (message: string) => {
      console.log("User submitted message:", message);

      // Simulate processing and response
      setTimeout(() => {
        ui.rerender({
          onMessageSubmit: handleMessageSubmit,
          onChatSelect: handleChatSelect,
          isLoading: false,
          currentFolder: "./my-project",
          currentModel: "gpt-4-turbo",
        });
      }, 2000);
    },

    onChatSelect: (chatId: string) => {
      console.log("User selected chat:", chatId);
    },

    isLoading: false,
    currentFolder: "./my-project",
    currentModel: "gpt-4-turbo",
  });

  const handleMessageSubmit = (message: string) => {
    console.log("Processing message:", message);

    // Show loading state
    ui.rerender({
      onMessageSubmit: handleMessageSubmit,
      onChatSelect: handleChatSelect,
      isLoading: true,
      currentFolder: "./my-project",
      currentModel: "gpt-4-turbo",
    });

    // Simulate API call
    setTimeout(() => {
      ui.rerender({
        onMessageSubmit: handleMessageSubmit,
        onChatSelect: handleChatSelect,
        isLoading: false,
        currentFolder: "./my-project",
        currentModel: "gpt-4-turbo",
      });
    }, 1500);
  };

  const handleChatSelect = (chatId: string) => {
    console.log("Loading chat:", chatId);
  };

  // Handle cleanup on exit
  process.on("SIGINT", () => {
    console.log("\nShutting down gracefully...");
    ui.unmount();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\nShutting down gracefully...");
    ui.unmount();
    process.exit(0);
  });
};

// Run the example if this file is executed directly
if (require.main === module) {
  runExample();
}

export default runExample;
