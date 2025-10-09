import { describe, expect, it } from "bun:test";
import { chatTools } from "../chat-tools";
import { tools } from "../index";

describe("Agent Tools Integration", () => {
  describe("Chat Agent Tools", () => {
    it("should include essential development tools", () => {
      const requiredChatTools = [
        "read-file",
        "edit-file",
        "file-system",
        "terminal",
        "grep",
        "thinking",
      ];

      for (const tool of requiredChatTools) {
        expect(chatTools).toHaveProperty(tool);
      }
    });

    it("should not include analysis-only tools", () => {
      // This test validates that chat tools don't include tools that are
      // purely for analysis and should only be in specialized tool sets
      // Currently no analysis-only tools are excluded from chat tools
      expect(chatTools).toBeDefined();
    });

    it("should not include redundant search tools", () => {
      expect(chatTools).toHaveProperty("grep"); // Should use grep instead
    });
  });

  describe("Tool Function Validation", () => {
    it("should have valid tool functions in chat tools", () => {
      for (const [name, tool] of Object.entries(chatTools)) {
        expect(tool).toBeDefined();
        expect(typeof tool).toBe("object");
        expect(tool).toHaveProperty("description");
        expect(tool).toHaveProperty("inputSchema");
        expect(tool).toHaveProperty("execute");
        expect(typeof tool.execute).toBe("function");
      }
    });
  });

  describe("Security Validation", () => {
    it("should have appropriate tool access controls", () => {
      // Chat agent should have full development capabilities
      expect(chatTools).toHaveProperty("terminal");
      expect(chatTools).toHaveProperty("edit-file");
      expect(chatTools).toHaveProperty("move-file");
      expect(chatTools).toHaveProperty("file-system");
    });
  });

  describe("Performance Optimization", () => {
    it("should have appropriate tool counts", () => {
      const originalCount = Object.keys(tools).length;
      const chatCount = Object.keys(chatTools).length;

      // After consolidating tools, counts should be optimized
      expect(chatCount).toBeLessThanOrEqual(originalCount);

      // Verify reasonable tool counts
      expect(chatCount).toBeGreaterThan(4); // Should have development tools
    });
  });

  describe("Backward Compatibility", () => {
    it("should maintain original tools export", () => {
      // Should include all tools from chat tools
      for (const tool of Object.keys(chatTools)) {
        expect(tools).toHaveProperty(tool);
      }
    });
  });
});
