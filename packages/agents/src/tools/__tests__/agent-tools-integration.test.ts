import { describe, it, expect } from "bun:test";
import { chatTools } from "../chat-tools";
import { initTools } from "../init-tools";
import { tools } from "../index";

describe("Agent Tools Integration", () => {
  describe("Tool Set Validation", () => {
    it("should have no duplicate tools between specialized sets", () => {
      const chatToolNames = Object.keys(chatTools);
      const initToolNames = Object.keys(initTools);

      // Both should have some common tools (like read-file, grep, thinking)
      const commonTools = chatToolNames.filter((tool) =>
        initToolNames.includes(tool),
      );
      expect(commonTools.length).toBeGreaterThan(0);

      // But each should have unique tools too
      const chatOnlyTools = chatToolNames.filter(
        (tool) => !initToolNames.includes(tool),
      );
      const initOnlyTools = initToolNames.filter(
        (tool) => !chatToolNames.includes(tool),
      );

      expect(chatOnlyTools.length).toBeGreaterThan(0);
      expect(initOnlyTools.length).toBeGreaterThan(0);
    });
  });

  describe("Chat Agent Tools", () => {
    it("should include essential development tools", () => {
      const requiredChatTools = [
        "read-file",
        "edit-file",
        "terminal",
        "grep",
        "thinking",
      ];

      for (const tool of requiredChatTools) {
        expect(chatTools).toHaveProperty(tool);
      }
    });

    it("should not include analysis-only tools", () => {
      const excludedTools = ["search-files"];

      for (const tool of excludedTools) {
        expect(chatTools).not.toHaveProperty(tool);
      }
    });

    it("should not include redundant search tools", () => {
      expect(chatTools).toHaveProperty("grep"); // Should use grep instead
    });
  });

  describe("Init Agent Tools", () => {
    it("should include essential analysis tools", () => {
      const requiredInitTools = ["read-file", "directory", "grep", "thinking"];

      for (const tool of requiredInitTools) {
        expect(initTools).toHaveProperty(tool);
      }
    });

    it("should not include development tools", () => {
      const excludedTools = [
        "terminal",
        "edit-file",
        "move-file",
        "fetch",
        "diff",
        "env-info",
      ];

      for (const tool of excludedTools) {
        expect(initTools).not.toHaveProperty(tool);
      }
    });
  });

  describe("Tool Function Validation", () => {
    it("should have valid tool functions in chat tools", () => {
      for (const [name, tool] of Object.entries(chatTools)) {
        expect(tool).toBeDefined();
        expect(typeof tool).toBe("object");
        expect(tool).toHaveProperty("description");
        expect(tool).toHaveProperty("parameters");
        expect(tool).toHaveProperty("execute");
        expect(typeof tool.execute).toBe("function");
      }
    });

    it("should have valid tool functions in init tools", () => {
      for (const [name, tool] of Object.entries(initTools)) {
        expect(tool).toBeDefined();
        expect(typeof tool).toBe("object");
        expect(tool).toHaveProperty("description");
        expect(tool).toHaveProperty("parameters");
        expect(tool).toHaveProperty("execute");
        expect(typeof tool.execute).toBe("function");
      }
    });
  });

  describe("Security Validation", () => {
    it("should restrict terminal access to chat agent only", () => {
      expect(chatTools).toHaveProperty("terminal");
      expect(initTools).not.toHaveProperty("terminal");
    });

    it("should restrict file modification tools appropriately", () => {
      // Chat agent should have full file modification capabilities
      expect(chatTools).toHaveProperty("edit-file");
      expect(chatTools).toHaveProperty("move-file");

      // Init agent should not have file modification tools
      expect(initTools).not.toHaveProperty("edit-file");
      expect(initTools).not.toHaveProperty("move-file");
    });
  });

  describe("Performance Optimization", () => {
    it("should have fewer tools than original set", () => {
      const originalCount = Object.keys(tools).length;
      const chatCount = Object.keys(chatTools).length;
      const initCount = Object.keys(initTools).length;

      expect(chatCount).toBeLessThan(originalCount);
      expect(initCount).toBeLessThan(originalCount);
      expect(initCount).toBeLessThan(chatCount); // Init should be most minimal
    });
  });

  describe("Backward Compatibility", () => {
    it("should maintain original tools export", () => {
      // Should include all tools from both specialized sets
      const allSpecializedTools = new Set([
        ...Object.keys(chatTools),
        ...Object.keys(initTools),
      ]);

      for (const tool of allSpecializedTools) {
        expect(tools).toHaveProperty(tool);
      }
    });
  });
});
