#!/usr/bin/env bun
import { startUI } from "./index.js";

// Simple test script to verify all components work
const runTest = async () => {
  console.log("🧪 Testing Chara CLI UI Components...\n");

  let testResults: string[] = [];
  let testCount = 0;

  const addTest = (name: string, passed: boolean) => {
    testCount++;
    const status = passed ? "✅ PASS" : "❌ FAIL";
    const result = `${status} Test ${testCount}: ${name}`;
    testResults.push(result);
    console.log(result);
  };

  try {
    // Test 1: UI starts without errors
    console.log("Starting UI initialization test...");
    const ui = startUI({
      onMessageSubmit: (message: string) => {
        console.log(`📝 Test message received: "${message}"`);
      },
      onChatSelect: (chatId: string) => {
        console.log(`💬 Test chat selected: ${chatId}`);
      },
      currentFolder: "./test-project",
      currentModel: "test-model",
    });
    addTest("UI initialization", true);

    // Test 2: UI renders with default props
    setTimeout(() => {
      try {
        ui.rerender({
          onMessageSubmit: (msg) => console.log("Rerender test:", msg),
          onChatSelect: (id) => console.log("Rerender chat:", id),
          isLoading: false,
          currentFolder: "./test-updated",
          currentModel: "gpt-4",
        });
        addTest("UI rerender with new props", true);
      } catch (error) {
        addTest("UI rerender with new props", false);
        console.error("Rerender error:", error);
      }
    }, 100);

    // Test 3: Loading state toggle
    setTimeout(() => {
      try {
        ui.rerender({
          onMessageSubmit: (msg) => console.log("Loading test:", msg),
          onChatSelect: (id) => console.log("Loading chat:", id),
          isLoading: true,
          currentFolder: "./test-loading",
          currentModel: "gpt-4-turbo",
        });
        addTest("Loading state toggle", true);
      } catch (error) {
        addTest("Loading state toggle", false);
        console.error("Loading state error:", error);
      }
    }, 200);

    // Test 4: Component cleanup
    setTimeout(() => {
      try {
        ui.unmount();
        addTest("UI cleanup/unmount", true);
      } catch (error) {
        addTest("UI cleanup/unmount", false);
        console.error("Cleanup error:", error);
      }

      // Test 5: Component exports
      setTimeout(async () => {
        try {
          const components = await import("./components/index.js");
          const expectedComponents = [
            "ChatsHistory",
            "ConversationViews",
            "DevServerInfo",
            "ServerLogs",
            "TextInput",
            "Layout",
          ];

          const hasAllComponents = expectedComponents.every(
            (comp) => comp in components
          );
          addTest("All components exported", hasAllComponents);

          if (!hasAllComponents) {
            console.log("Missing components:",
              expectedComponents.filter(comp => !(comp in components))
            );
          }
        } catch (error) {
          addTest("All components exported", false);
          console.error("Component export error:", error);
        }

        // Final results
        setTimeout(() => {
          console.log("\n" + "─".repeat(50));
          console.log("🏁 Test Results Summary:");
          console.log("─".repeat(50));

          testResults.forEach((result) => console.log(result));

          const passedTests = testResults.filter(r => r.includes("✅")).length;
          const totalTests = testResults.length;

          console.log("─".repeat(50));
          console.log(`📊 ${passedTests}/${totalTests} tests passed`);

          if (passedTests === totalTests) {
            console.log("🎉 All tests passed! UI components are working correctly.");
          } else {
            console.log("⚠️  Some tests failed. Check the output above for details.");
          }

          console.log("\n💡 To run the interactive demo:");
          console.log("   bun run demo:ui");

          process.exit(passedTests === totalTests ? 0 : 1);
        }, 100);
      }, 100);
    }, 300);

  } catch (error) {
    addTest("UI initialization", false);
    console.error("❌ Critical error during UI test:", error);

    setTimeout(() => {
      console.log("\n📋 Test failed with critical error.");
      console.log("This might be due to:");
      console.log("  • Missing dependencies (ink, react)");
      console.log("  • TypeScript compilation issues");
      console.log("  • Terminal compatibility problems");
      process.exit(1);
    }, 100);
  }
};

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Test interrupted by user");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Test terminated");
  process.exit(0);
});

// Run the test if this file is executed directly
if (import.meta.main) {
  runTest().catch((error) => {
    console.error("❌ Test script failed:", error);
    process.exit(1);
  });
}

export default runTest;
