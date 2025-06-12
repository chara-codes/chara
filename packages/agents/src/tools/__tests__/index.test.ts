import { describe, test, expect } from "bun:test";

// Import all test files to ensure they run
import "./current-dir.test";
import "./read-file.test";
import "./write-file.test";
import "./read-multiple-files.test";
import "./edit-file.test";
import "./create-directory.test";
import "./list-directory.test";
import "./directory-tree.test";
import "./move-file.test";
import "./search-files.test";
import "./get-file-info.test";
import "./terminal.test";
import "./grep.test";
import "./thinking.test";
import "./init-git.test";

// Import all tools to verify they export correctly
import { tools } from "../index";

describe("Tools Index", () => {
  test("should export all expected tools", () => {
    const expectedTools = [
      "read-file",
      "current-dir",
      "write-file",
      "read-multiple-files",
      "edit-file",
      "create-directory",
      "list-directory",
      "directory-tree",
      "move-file",
      "search-files",
      "get-file-info",
      "fetch",
      "terminal",
      "grep",
      "thinking",
      "init-git",
    ];

    expectedTools.forEach((toolName) => {
      expect(tools[toolName]).toBeDefined();
      expect(typeof tools[toolName]).toBe("object");
      expect(tools[toolName].description).toBeDefined();
      expect(tools[toolName].parameters).toBeDefined();
      expect(tools[toolName].execute).toBeDefined();
      expect(typeof tools[toolName].execute).toBe("function");
    });
  });

  test("should have correct number of tools", () => {
    expect(Object.keys(tools)).toHaveLength(16);
  });

  test("should not have duplicate tool names", () => {
    const toolNames = Object.keys(tools);
    const uniqueNames = new Set(toolNames);
    expect(toolNames.length).toBe(uniqueNames.size);
  });

  test("all tools should have required properties", () => {
    Object.entries(tools).forEach(([name, tool]) => {
      expect(tool).toHaveProperty("description");
      expect(tool).toHaveProperty("parameters");
      expect(tool).toHaveProperty("execute");

      expect(typeof tool.description).toBe("string");
      expect(tool.description.length).toBeGreaterThan(0);
      expect(typeof tool.execute).toBe("function");
    });
  });
});
