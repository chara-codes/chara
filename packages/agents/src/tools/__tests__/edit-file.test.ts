import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { editFile } from "../edit-file";
import { createTestFS } from "./test-utils";

describe("editFile tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  test("should perform simple text replacement", async () => {
    const originalContent = "Hello World!\nThis is a test.";
    const filePath = await testFS.createFile("simple.txt", originalContent);

    const result = await editFile.execute({
      path: filePath,
      edits: [{ oldText: "World", newText: "Universe" }],
    });

    expect(result.status).toBe("success");
    expect(result.message).toContain("Successfully edited");
    expect(await testFS.readFile("simple.txt")).toBe(
      "Hello Universe!\nThis is a test."
    );
  });

  test("should perform multiple edits sequentially", async () => {
    const originalContent = "Hello World!\nThis is a test.\nGoodbye World!";
    const filePath = await testFS.createFile("multiple.txt", originalContent);

    const result = await editFile.execute({
      path: filePath,
      edits: [
        { oldText: "World", newText: "Universe" },
        { oldText: "test", newText: "example" },
      ],
    });

    expect(result.status).toBe("success");
    const newContent = await testFS.readFile("multiple.txt");
    expect(newContent).toBe(
      "Hello Universe!\nThis is a example.\nGoodbye Universe!"
    );
  });

  test("should handle multiline text replacement", async () => {
    const originalContent =
      "function test() {\n  console.log('old');\n  return true;\n}";
    const filePath = await testFS.createFile("multiline.js", originalContent);

    const result = await editFile.execute({
      path: filePath,
      edits: [
        {
          oldText:
            "function test() {\n  console.log('old');\n  return true;\n}",
          newText:
            "function test() {\n  console.log('new');\n  return false;\n}",
        },
      ],
    });

    expect(result.status).toBe("success");
    const newContent = await testFS.readFile("multiline.js");
    expect(newContent).toBe(
      "function test() {\n  console.log('new');\n  return false;\n}"
    );
  });

  test("should preserve indentation", async () => {
    const originalContent =
      "  function test() {\n    console.log('hello');\n  }";
    const filePath = await testFS.createFile("indented.js", originalContent);

    const result = await editFile.execute({
      path: filePath,
      edits: [
        {
          oldText: "console.log('hello');",
          newText: "console.log('world');",
        },
      ],
    });

    expect(result.status).toBe("success");
    const newContent = await testFS.readFile("indented.js");
    expect(newContent).toBe(
      "  function test() {\n    console.log('world');\n  }"
    );
  });

  test("should handle whitespace-flexible matching", async () => {
    const originalContent = "  if (condition) {\n    doSomething();\n  }";
    const filePath = await testFS.createFile("whitespace.js", originalContent);

    const result = await editFile.execute({
      path: filePath,
      edits: [
        {
          oldText: "if (condition) {\n  doSomething();\n}",
          newText: "if (newCondition) {\n  doSomethingElse();\n}",
        },
      ],
    });

    expect(result.status).toBe("success");
    const newContent = await testFS.readFile("whitespace.js");
    expect(newContent).toBe("  if (newCondition) {\n  doSomethingElse();\n}");
  });

  test("should generate diff output", async () => {
    const originalContent = "Line 1\nLine 2\nLine 3";
    const filePath = await testFS.createFile("diff.txt", originalContent);

    const result = await editFile.execute({
      path: filePath,
      edits: [{ oldText: "Line 2", newText: "Modified Line 2" }],
    });

    expect(result.diff).toContain("- Line 2");
    expect(result.diff).toContain("+ Modified Line 2");
  });

  test("should return error object for non-matching text", async () => {
    const originalContent = "Hello World!";
    const filePath = await testFS.createFile("nomatch.txt", originalContent);

    const result = await editFile.execute({
      path: filePath,
      edits: [{ oldText: "Non-existent text", newText: "Replacement" }],
    });

    expect(result.status).toBe("error");
    expect(result.message).toContain("Could not find exact match");
    expect(result.operation).toBe("edit");
    expect(result.path).toBe(filePath);
  });

  test("should handle empty file", async () => {
    const filePath = await testFS.createFile("empty.txt", "");

    const result = await editFile.execute({
      path: filePath,
      edits: [{ oldText: "anything", newText: "something" }],
    });

    expect(result.status).toBe("error");
    expect(result.message).toContain("Could not find exact match");
    expect(result.operation).toBe("edit");
    expect(result.path).toBe(filePath);
  });

  test("should handle empty edits array", async () => {
    const originalContent = "Hello World!";
    const filePath = await testFS.createFile("noedits.txt", originalContent);

    const result = await editFile.execute({
      path: filePath,
      edits: [],
    } as any);

    expect(result.status).toBe("error");
    expect(result.message).toContain("'edits' parameter is required");
  });

  test("should handle line ending normalization", async () => {
    const originalContent = "Line 1\r\nLine 2\r\nLine 3";
    const filePath = await testFS.createFile("windows.txt", originalContent);

    const result = await editFile.execute({
      path: filePath,
      edits: [{ oldText: "Line 2", newText: "Modified Line 2" }],
    });

    expect(result.status).toBe("success");
    const newContent = await testFS.readFile("windows.txt");
    expect(newContent).toContain("Modified Line 2");
  });

  test("should handle special characters in text", async () => {
    const originalContent = "Special: éñü 🚀 <>&\"'";
    const filePath = await testFS.createFile("special.txt", originalContent);

    const result = await editFile.execute({
      path: filePath,
      edits: [{ oldText: "éñü 🚀", newText: "abc 123" }],
    });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("special.txt")).toBe(
      "Special: abc 123 <>&\"'"
    );
  });

  test("should handle replacing entire file content", async () => {
    const originalContent = "Old content\nMultiple lines\nTo replace";
    const filePath = await testFS.createFile(
      "replace-all.txt",
      originalContent
    );

    const result = await editFile.execute({
      path: filePath,
      edits: [{ oldText: originalContent, newText: "Brand new content" }],
    });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("replace-all.txt")).toBe("Brand new content");
  });

  test("should handle adding content to empty sections", async () => {
    const originalContent = "Before\n\nAfter";
    const filePath = await testFS.createFile(
      "empty-section.txt",
      originalContent
    );

    const result = await editFile.execute({
      path: filePath,
      edits: [{ oldText: "\n\n", newText: "\nMiddle content\n" }],
    });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("empty-section.txt")).toBe(
      "Before\nMiddle content\nAfter"
    );
  });

  test("should handle complex indentation preservation", async () => {
    const originalContent =
      "    function nested() {\n      if (true) {\n        oldFunction();\n      }\n    }";
    const filePath = await testFS.createFile("nested.js", originalContent);

    const result = await editFile.execute({
      path: filePath,
      edits: [
        {
          oldText: "if (true) {\n        oldFunction();\n      }",
          newText:
            "if (false) {\n        newFunction();\n        anotherFunction();\n      }",
        },
      ],
    });

    expect(result.status).toBe("success");
    const newContent = await testFS.readFile("nested.js");
    expect(newContent).toContain("newFunction();");
    expect(newContent).toContain("anotherFunction();");
    expect(newContent).toContain("      if (false)");
  });

  test("should return error object for non-existent file", async () => {
    const nonExistentPath = testFS.getPath("does-not-exist.txt");

    const result = await editFile.execute({
      path: nonExistentPath,
      edits: [{ oldText: "anything", newText: "something" }],
    });

    expect(result.status).toBe("error");
    expect(result.message).toContain("does not exist");
    expect(result.operation).toBe("edit");
    expect(result.path).toBe(nonExistentPath);
  });

  test("should handle overlapping replacements correctly", async () => {
    const originalContent = "abcdef";
    const filePath = await testFS.createFile("overlap.txt", originalContent);

    const result = await editFile.execute({
      path: filePath,
      edits: [
        { oldText: "abc", newText: "xyz" },
        { oldText: "def", newText: "uvw" },
      ],
    });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("overlap.txt")).toBe("xyzuvw");
  });

  test("should have correct tool metadata", () => {
    expect(editFile.description).toContain("making edits to existing files");
    expect(editFile.parameters).toBeDefined();
  });

  test("should handle large file edits", async () => {
    const largeContent =
      "x".repeat(5000) + "\nTARGET LINE\n" + "y".repeat(5000);
    const filePath = await testFS.createFile("large.txt", largeContent);

    const result = await editFile.execute({
      path: filePath,
      edits: [{ oldText: "TARGET LINE", newText: "MODIFIED LINE" }],
    });

    expect(result.status).toBe("success");
    const newContent = await testFS.readFile("large.txt");
    expect(newContent).toContain("MODIFIED LINE");
    expect(newContent).not.toContain("TARGET LINE");
  });

  test("should require edits parameter", async () => {
    const filePath = await testFS.createFile("test.txt", "content");

    const result = await editFile.execute({
      path: filePath,
      edits: [],
    });

    expect(result.status).toBe("error");
    expect(result.message).toContain("'edits' parameter is required");
    expect(result.operation).toBe("edit");
    expect(result.path).toBe(filePath);
  });

  test("should return error object with correct structure for validation failures", async () => {
    const filePath = testFS.getPath("non-existent.txt");

    const result = await editFile.execute({
      path: filePath,
      edits: [{ oldText: "test", newText: "new" }],
    });

    expect(result).toHaveProperty("status", "error");
    expect(result).toHaveProperty("message");
    expect(result).toHaveProperty("operation", "edit");
    expect(result).toHaveProperty("path", filePath);
    expect(typeof result.message).toBe("string");
    expect(result.message).toContain("does not exist");
  });

  test("should handle error cases with proper error object structure", async () => {
    // Test error scenarios to ensure consistent error object structure
    const nonExistentPath = testFS.getPath("non-existent.txt");

    const result = await editFile.execute({
      path: nonExistentPath,
      edits: [{ oldText: "test", newText: "new" }],
    });

    expect(result.status).toBe("error");
    expect(result.message).toContain("does not exist");
    expect(result.operation).toBe("edit");
    expect(result.path).toBe(nonExistentPath);
    expect(typeof result.message).toBe("string");
  });

  test("should provide helpful error messages for LLM agents", async () => {
    const filePath = await testFS.createFile(
      "context.txt",
      "Hello world\nThis is a test file."
    );

    const result = await editFile.execute({
      path: filePath,
      edits: [{ oldText: "non-existent text", newText: "replacement" }],
    });

    expect(result.status).toBe("error");
    expect(result.message).toContain("Could not find exact match");
    expect(result.message).toContain("non-existent text");
    expect(result.message).toContain(filePath);
  });
});
