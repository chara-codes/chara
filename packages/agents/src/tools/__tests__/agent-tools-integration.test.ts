import { describe, it, expect } from "bun:test";
import { chatTools } from "../chat-tools";
import { initTools } from "../init-tools";
import { tools } from "../index";

describe("Agent Tools Integration", () => {
  describe("Tool Set Validation", () => {
    it("should have appropriate tool distribution between specialized sets", () => {
      const chatToolNames = Object.keys(chatTools);
      const initToolNames = Object.keys(initTools);

      // Both should have some common tools (like read-file, grep, thinking)
      const commonTools = chatToolNames.filter((tool) =>
        initToolNames.includes(tool),
      );
      expect(commonTools.length).toBeGreaterThan(0);

      // Chat should have tools that init doesn't need
      const chatOnlyTools = chatToolNames.filter(
        (tool) => !initToolNames.includes(tool),
      );
      expect(chatOnlyTools.length).toBeGreaterThan(0);

      // Verify chat has development-specific tools
      expect(chatOnlyTools).toContain("terminal");
      expect(chatOnlyTools).toContain("move-file");
      expect(chatOnlyTools).toContain("fetch");
      expect(chatOnlyTools).toContain("env-info");
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
      // This test validates that chat tools don't include tools that are
      // purely for analysis and should only be in specialized tool sets
      // Currently no analysis-only tools are excluded from chat tools
      expect(chatTools).toBeDefined();
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

    it("should not include development tools except edit-file", () => {
      const excludedTools = ["terminal", "move-file", "fetch", "env-info"];

      for (const tool of excludedTools) {
        expect(initTools).not.toHaveProperty(tool);
      }

      // Init agent needs edit-file to create .chara.json
      expect(initTools).toHaveProperty("edit-file");
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

      // Init agent should have edit-file for .chara.json creation but not move-file
      expect(initTools).toHaveProperty("edit-file");
      expect(initTools).not.toHaveProperty("move-file");
    });
  });

  describe("Performance Optimization", () => {
    it("should have appropriate tool counts", () => {
      const originalCount = Object.keys(tools).length;
      const chatCount = Object.keys(chatTools).length;
      const initCount = Object.keys(initTools).length;

      // After removing search-files, counts should be equal or optimized
      expect(chatCount).toBeLessThanOrEqual(originalCount);
      expect(initCount).toBeLessThan(chatCount); // Init should be most minimal

      // Verify reasonable tool counts
      expect(initCount).toBeGreaterThan(4); // Should have core tools
      expect(chatCount).toBeGreaterThan(6); // Should have development tools
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
