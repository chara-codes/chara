import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { editFile } from "../edit-file";
import { createTestFS } from "./test-utils";

type EditFileResult = {
  status: "success" | "error";
  message: string;
  operation: string;
  path: string;
  diff?: string;
  suggestion?: string;
};

describe("editFile tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  describe("File creation", () => {
    test("should create new file with empty old_string", async () => {
      const filePath = testFS.getPath("new-file.txt");

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "",
        new_string: "Hello, new file!",
      })) as EditFileResult;

      expect(result.status).toBe("success");
      expect(result.message).toContain("Successfully created new file");
      expect(result.operation).toBe("created");
      expect(await testFS.readFile("new-file.txt")).toBe("Hello, new file!");
    });

    test("should create file with multiline content", async () => {
      const filePath = testFS.getPath("multiline.js");
      const content = `function hello() {
  console.log('Hello, world!');
  return true;
}`;

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "",
        new_string: content,
      })) as EditFileResult;

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(await testFS.readFile("multiline.js")).toBe(content);
    });

    test("should create parent directories when creating new file", async () => {
      const filePath = testFS.getPath("deep/nested/path/file.txt");

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "",
        new_string: "Content in nested directory",
      })) as EditFileResult;

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(await testFS.readFile("deep/nested/path/file.txt")).toBe(
        "Content in nested directory"
      );
    });

    test("should error when trying to create file that already exists", async () => {
      const filePath = await testFS.createFile(
        "existing.txt",
        "existing content"
      );

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "",
        new_string: "new content",
      })) as EditFileResult;

      expect(result.status).toBe("error");
      expect(result.message).toContain("already exists");
      expect(result.operation).toBe("create");
    });
  });

  describe("File editing", () => {
    test("should perform simple text replacement", async () => {
      const originalContent = "Hello World!\nThis is a test.";
      const filePath = await testFS.createFile("simple.txt", originalContent);

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "World",
        new_string: "Universe",
      })) as EditFileResult;

      expect(result.status).toBe("success");
      expect(result.message).toContain("Successfully edited");
      expect(result.operation).toBe("edited");
      expect(await testFS.readFile("simple.txt")).toBe(
        "Hello Universe!\nThis is a test."
      );
    });

    test("should handle multiline text replacement", async () => {
      const originalContent = `function test() {
  console.log('old');
  return true;
}`;
      const filePath = await testFS.createFile("multiline.js", originalContent);

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: `function test() {
  console.log('old');
  return true;
}`,
        new_string: `function test() {
  console.log('new');
  return false;
}`,
      })) as EditFileResult;

      expect(result.status).toBe("success");
      expect(result.operation).toBe("edited");
      const newContent = await testFS.readFile("multiline.js");
      expect(newContent).toBe(`function test() {
  console.log('new');
  return false;
}`);
    });

    test("should handle multiple occurrences with expected_occurrences", async () => {
      const originalContent = "Hello World!\nGoodbye World!\nAnother World!";
      const filePath = await testFS.createFile("multiple.txt", originalContent);

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "World",
        new_string: "Universe",
        expected_occurrences: 3,
      })) as EditFileResult;

      expect(result.status).toBe("success");
      expect(result.message).toContain("3 replacement(s)");
      const newContent = await testFS.readFile("multiple.txt");
      expect(newContent).toBe(
        "Hello Universe!\nGoodbye Universe!\nAnother Universe!"
      );
    });

    test("should error when occurrence count doesn't match expected", async () => {
      const originalContent = "Hello World!\nGoodbye World!";
      const filePath = await testFS.createFile("mismatch.txt", originalContent);

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "World",
        new_string: "Universe",
        expected_occurrences: 3,
      })) as EditFileResult;

      expect(result.status).toBe("error");
      expect(result.message).toContain("Expected 3 occurrence(s) but found 2");
      expect(result.operation).toBe("edit");
    });

    test("should preserve original content when old_string and new_string are identical", async () => {
      const originalContent = "Hello World!";
      const filePath = await testFS.createFile(
        "identical.txt",
        originalContent
      );

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "World",
        new_string: "World",
      })) as EditFileResult;

      expect(result.status).toBe("success");
      expect(result.operation).toBe("no-change");
      expect(result.message).toContain(
        "old_string and new_string are identical"
      );
    });

    test("should handle line ending normalization", async () => {
      const originalContent = "Line 1\r\nLine 2\r\nLine 3";
      const filePath = await testFS.createFile("windows.txt", originalContent);

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "Line 2",
        new_string: "Modified Line 2",
      })) as EditFileResult;

      expect(result.status).toBe("success");
      const newContent = await testFS.readFile("windows.txt");
      expect(newContent).toContain("Modified Line 2");
    });
  });

  describe("Flexible matching", () => {
    test("should handle whitespace-flexible matching", async () => {
      const originalContent = "  if (condition) {\n    doSomething();\n  }";
      const filePath = await testFS.createFile(
        "whitespace.js",
        originalContent
      );

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "if (condition) {\n  doSomething();\n}",
        new_string: "if (newCondition) {\n  doSomethingElse();\n}",
      })) as EditFileResult;

      expect(result.status).toBe("success");
      expect(result.message).toContain("flexible matching applied");
      const newContent = await testFS.readFile("whitespace.js");
      expect(newContent).toBe(
        "  if (newCondition) {\n    doSomethingElse();\n  }"
      );
    });

    test("should preserve indentation with flexible matching", async () => {
      const originalContent = `    function nested() {
      if (true) {
        oldFunction();
      }
    }`;
      const filePath = await testFS.createFile("nested.js", originalContent);

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: `if (true) {
  oldFunction();
}`,
        new_string: `if (false) {
  newFunction();
  anotherFunction();
}`,
      })) as EditFileResult;

      expect(result.status).toBe("success");
      const newContent = await testFS.readFile("nested.js");
      expect(newContent).toContain("newFunction();");
      expect(newContent).toContain("anotherFunction();");
      expect(newContent).toContain("      if (false)");
    });

    test("should maintain relative indentation in multiline replacements", async () => {
      const originalContent = `  class Example {
    method() {
      console.log('old');
      return true;
    }
  }`;
      const filePath = await testFS.createFile(
        "indentation.js",
        originalContent
      );

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: `method() {
  console.log('old');
  return true;
}`,
        new_string: `method() {
  console.log('new');
  console.log('additional');
  return false;
}`,
      })) as EditFileResult;

      expect(result.status).toBe("success");
      const newContent = await testFS.readFile("indentation.js");
      expect(newContent).toContain("    method() {");
      expect(newContent).toContain("      console.log('new');");
      expect(newContent).toContain("      console.log('additional');");
    });
  });

  describe("Error handling", () => {
    test("should error when editing non-existent file", async () => {
      const nonExistentPath = testFS.getPath("does-not-exist.txt");

      const result = (await (editFile as any).execute({
        path: nonExistentPath,
        old_string: "anything",
        new_string: "something",
      })) as EditFileResult;

      expect(result.status).toBe("error");
      expect(result.message).toContain("does not exist");
      expect(result.operation).toBe("edit");
      expect(result.path).toBe(nonExistentPath);
    });

    test("should error when old_string is not found", async () => {
      const originalContent = "Hello World!";
      const filePath = await testFS.createFile("nomatch.txt", originalContent);

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "Non-existent text",
        new_string: "Replacement",
      })) as EditFileResult;

      expect(result.status).toBe("error");
      expect(result.message).toContain("Could not find exact match");
      expect(result.operation).toBe("edit");
      expect(result.path).toBe(filePath);
      expect(result.suggestion).toContain("Include more context");
    });

    test("should provide helpful suggestions in error messages", async () => {
      const filePath = await testFS.createFile("test.txt", "Hello world");

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "hello world", // lowercase, won't match
        new_string: "Hello universe",
      })) as EditFileResult;

      expect(result.status).toBe("error");
      expect(result.suggestion).toContain("Include more context");
    });

    test("should handle file read errors gracefully", async () => {
      // This test simulates a permission error or other read failure
      const filePath = testFS.getPath("unreadable.txt");

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "test",
        new_string: "new",
      })) as EditFileResult;

      expect(result.status).toBe("error");
      expect(result.message).toContain("does not exist");
      expect(result.operation).toBe("edit");
    });
  });

  describe("Diff generation", () => {
    test("should generate proper diff output", async () => {
      const originalContent = "Line 1\nLine 2\nLine 3";
      const filePath = await testFS.createFile("diff.txt", originalContent);

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "Line 2",
        new_string: "Modified Line 2",
      })) as EditFileResult;

      expect(result.status).toBe("success");
      expect(result.diff).toContain("Changes: +1 -1 lines");
      expect(result.diff).toContain("- Line 2");
      expect(result.diff).toContain("+ Modified Line 2");
    });

    test("should show line count in diff for multiline changes", async () => {
      const originalContent = "function test() {\n  return true;\n}";
      const filePath = await testFS.createFile(
        "multiline-diff.js",
        originalContent
      );

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "function test() {\n  return true;\n}",
        new_string:
          "function test() {\n  console.log('debug');\n  return false;\n}",
      })) as EditFileResult;

      expect(result.status).toBe("success");
      expect(result.diff).toContain("Changes:");
      expect(result.diff).toContain("lines");
    });

    test("should return 'No changes' when content is identical after replacement", async () => {
      const originalContent = "Hello World!";
      const filePath = await testFS.createFile(
        "no-change.txt",
        originalContent
      );

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "Hello World!",
        new_string: "Hello World!",
      })) as EditFileResult;

      expect(result.status).toBe("success");
      expect(result.operation).toBe("no-change");
      expect(result.diff).toBe("No changes");
    });
  });

  describe("Special cases", () => {
    test("should handle special characters in text", async () => {
      const originalContent = "Special: éñü 🚀 <>&\"'";
      const filePath = await testFS.createFile("special.txt", originalContent);

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "éñü 🚀",
        new_string: "abc 123",
      })) as EditFileResult;

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

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: originalContent,
        new_string: "Brand new content",
      })) as EditFileResult;

      expect(result.status).toBe("success");
      expect(await testFS.readFile("replace-all.txt")).toBe(
        "Brand new content"
      );
    });

    test("should handle empty file content", async () => {
      const filePath = await testFS.createFile("empty.txt", "");

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "anything",
        new_string: "something",
      })) as EditFileResult;

      expect(result.status).toBe("error");
      expect(result.message).toContain("Could not find exact match");
    });

    test("should handle large file edits efficiently", async () => {
      const largeContent =
        "x".repeat(5000) + "\nTARGET LINE\n" + "y".repeat(5000);
      const filePath = await testFS.createFile("large.txt", largeContent);

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "TARGET LINE",
        new_string: "MODIFIED LINE",
      })) as EditFileResult;

      expect(result.status).toBe("success");
      const newContent = await testFS.readFile("large.txt");
      expect(newContent).toContain("MODIFIED LINE");
      expect(newContent).not.toContain("TARGET LINE");
    });

    test("should handle adding content to empty sections", async () => {
      const originalContent = "Before\n\nAfter";
      const filePath = await testFS.createFile(
        "empty-section.txt",
        originalContent
      );

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "\n\n",
        new_string: "\nMiddle content\n",
      })) as EditFileResult;

      expect(result.status).toBe("success");
      expect(await testFS.readFile("empty-section.txt")).toBe(
        "Before\nMiddle content\nAfter"
      );
    });

    test("should handle zero occurrences with flexible matching fallback", async () => {
      const originalContent =
        "  function test() {\n    console.log('hello');\n  }";
      const filePath = await testFS.createFile(
        "zero-occur.js",
        originalContent
      );

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "function test() {\nconsole.log('hello');\n}", // missing indentation
        new_string: "function test() {\nconsole.log('world');\n}",
      })) as EditFileResult;

      expect(result.status).toBe("success");
      expect(result.message).toContain("flexible matching applied");
    });
  });

  describe("Tool metadata", () => {
    test("should have correct tool description and schema", () => {
      expect(editFile.description).toContain("making edits to existing files");
      expect(editFile.description).toContain("creating new files");
      expect(editFile.inputSchema).toBeDefined();
      expect(editFile.inputSchema).toBeDefined();
    });
  });

  describe("Edge cases and validation", () => {
    test("should handle default expected_occurrences of 1", async () => {
      const originalContent = "Hello World!";
      const filePath = await testFS.createFile(
        "default-occur.txt",
        originalContent
      );

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "World",
        new_string: "Universe",
        // expected_occurrences not provided, should default to 1
      })) as EditFileResult;

      expect(result.status).toBe("success");
      expect(result.message).toContain("1 replacement(s)");
    });

    test("should return consistent error object structure", async () => {
      const filePath = testFS.getPath("non-existent.txt");

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "test",
        new_string: "new",
      })) as EditFileResult;

      expect(result).toHaveProperty("status", "error");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("operation", "edit");
      expect(result).toHaveProperty("path", filePath);
      expect(typeof result.message).toBe("string");
    });

    test("should provide helpful context in error messages for LLM agents", async () => {
      const filePath = await testFS.createFile(
        "context.txt",
        "Hello world\nThis is a test file."
      );

      const result = (await (editFile as any).execute({
        path: filePath,
        old_string: "non-existent text",
        new_string: "replacement",
      })) as EditFileResult;

      expect(result.status).toBe("error");
      expect(result.message).toContain("Could not find exact match");
      expect(result.message).toContain("non-existent text");
      expect(result.suggestion).toBeDefined();
    });
  });
});
