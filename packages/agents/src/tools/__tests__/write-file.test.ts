import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { writeFile } from "../write-file";
import { createTestFS } from "./test-utils";

describe("writeFile tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  describe("creating new files", () => {
    test("should create a new file with simple content", async () => {
      const filePath = testFS.getPath("new-file.txt");
      const content = "This is a new file";

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.message).toContain("Created file");
      expect(result.operation).toBe("created");
      expect(result.path).toBe(filePath);
      expect(result.contentLength).toBe(content.length);
      expect(result.isNewFile).toBe(true);
      expect(await testFS.readFile("new-file.txt")).toBe(content);
    });

    test("should create a new file with empty content", async () => {
      const filePath = testFS.getPath("empty.txt");
      const content = "";

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(result.contentLength).toBe(0);
      expect(result.isNewFile).toBe(true);
      expect(await testFS.readFile("empty.txt")).toBe("");
    });

    test("should create a new file with multiline content", async () => {
      const filePath = testFS.getPath("multiline.txt");
      const content = `Line 1
Line 2
Line 3
Final line`;

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(result.isNewFile).toBe(true);
      expect(await testFS.readFile("multiline.txt")).toBe(content);
    });

    test("should create a new file with special characters", async () => {
      const filePath = testFS.getPath("special.txt");
      const content =
        "Special chars: àáâãäåæçèéêë 中文 🚀 \"quotes\" 'apostrophes' <tags>";

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(result.isNewFile).toBe(true);
      expect(await testFS.readFile("special.txt")).toBe(content);
    });

    test("should create a new file with JSON content", async () => {
      const filePath = testFS.getPath("config.json");
      const content = JSON.stringify(
        {
          name: "test-app",
          version: "1.0.0",
          dependencies: {
            "some-package": "^1.0.0",
          },
        },
        null,
        2
      );

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(result.isNewFile).toBe(true);
      expect(await testFS.readFile("config.json")).toBe(content);
    });

    test("should create a new file with large content", async () => {
      const filePath = testFS.getPath("large.txt");
      const content = "A".repeat(50000);

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(result.contentLength).toBe(50000);
      expect(result.isNewFile).toBe(true);
      expect(await testFS.readFile("large.txt")).toBe(content);
    });
  });

  describe("overwriting existing files", () => {
    test("should overwrite an existing file", async () => {
      const originalContent = "Original content";
      const newContent = "Completely new content";
      const filePath = await testFS.createFile(
        "overwrite.txt",
        originalContent
      );

      const result = await writeFile.execute({
        path: filePath,
        content: newContent,
      });

      expect(result.status).toBe("success");
      expect(result.message).toContain("Overwrote file");
      expect(result.operation).toBe("overwritten");
      expect(result.path).toBe(filePath);
      expect(result.contentLength).toBe(newContent.length);
      expect(result.isNewFile).toBe(false);
      expect(await testFS.readFile("overwrite.txt")).toBe(newContent);
    });

    test("should overwrite an existing file with empty content", async () => {
      const filePath = await testFS.createFile(
        "clear.txt",
        "Some content to clear"
      );

      const result = await writeFile.execute({
        path: filePath,
        content: "",
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("overwritten");
      expect(result.contentLength).toBe(0);
      expect(result.isNewFile).toBe(false);
      expect(await testFS.readFile("clear.txt")).toBe("");
    });

    test("should overwrite an existing file multiple times", async () => {
      const filePath = await testFS.createFile("multiple.txt", "Version 1");

      // First overwrite
      const result1 = await writeFile.execute({
        path: filePath,
        content: "Version 2",
      });

      expect(result1.status).toBe("success");
      expect(result1.operation).toBe("overwritten");
      expect(result1.isNewFile).toBe(false);
      expect(await testFS.readFile("multiple.txt")).toBe("Version 2");

      // Second overwrite
      const result2 = await writeFile.execute({
        path: filePath,
        content: "Version 3",
      });

      expect(result2.status).toBe("success");
      expect(result2.operation).toBe("overwritten");
      expect(result2.isNewFile).toBe(false);
      expect(await testFS.readFile("multiple.txt")).toBe("Version 3");
    });

    test("should overwrite a large existing file", async () => {
      const originalContent = "Small content";
      const newContent = "B".repeat(100000);
      const filePath = await testFS.createFile(
        "large-overwrite.txt",
        originalContent
      );

      const result = await writeFile.execute({
        path: filePath,
        content: newContent,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("overwritten");
      expect(result.contentLength).toBe(100000);
      expect(result.isNewFile).toBe(false);
      expect(await testFS.readFile("large-overwrite.txt")).toBe(newContent);
    });
  });

  describe("directory handling", () => {
    test("should create parent directories when creating a file", async () => {
      const filePath = testFS.getPath("nested/deep/directory/file.txt");
      const content = "Content in nested directory";

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(result.isNewFile).toBe(true);
      expect(await testFS.readFile("nested/deep/directory/file.txt")).toBe(
        content
      );
    });

    test("should create multiple levels of nested directories", async () => {
      const filePath = testFS.getPath(
        "very/deeply/nested/path/with/many/levels/file.txt"
      );
      const content = "Deep nesting test";

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(result.isNewFile).toBe(true);
      expect(
        await testFS.readFile(
          "very/deeply/nested/path/with/many/levels/file.txt"
        )
      ).toBe(content);
    });

    test("should handle files with special characters in directory names", async () => {
      const filePath = testFS.getPath(
        "special-chars_123/sub.dir/file-name.txt"
      );
      const content = "Special directory names";

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(result.isNewFile).toBe(true);
      expect(
        await testFS.readFile("special-chars_123/sub.dir/file-name.txt")
      ).toBe(content);
    });
  });

  describe("content types", () => {
    test("should handle binary-like content", async () => {
      const filePath = testFS.getPath("binary.txt");
      const content = "\x00\x01\x02\x03\xFF\xFE\xFD";

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(result.isNewFile).toBe(true);
      expect(await testFS.readFile("binary.txt")).toBe(content);
    });

    test("should handle code content with various languages", async () => {
      const filePath = testFS.getPath("code.tsx");
      const content = `import React from 'react';

interface Props {
  title: string;
  onClick: () => void;
}

export const Button: React.FC<Props> = ({ title, onClick }) => {
  return (
    <button
      className="btn btn-primary"
      onClick={onClick}
      data-testid="custom-button"
    >
      {title}
    </button>
  );
};

export default Button;`;

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(result.isNewFile).toBe(true);
      expect(await testFS.readFile("code.tsx")).toBe(content);
    });

    test("should handle content with different line endings", async () => {
      const filePath = testFS.getPath("line-endings.txt");
      const content = "Line 1\nLine 2\r\nLine 3\rLine 4";

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(result.isNewFile).toBe(true);
      expect(await testFS.readFile("line-endings.txt")).toBe(content);
    });

    test("should handle content with tabs and spaces", async () => {
      const filePath = testFS.getPath("whitespace.txt");
      const content =
        "Tabs:\t\t\tSpaces:   \nMixed:\t  \t  \nTrailing spaces:  \nTrailing tab:\t";

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(result.isNewFile).toBe(true);
      expect(await testFS.readFile("whitespace.txt")).toBe(content);
    });
  });

  describe("auto-detection behavior", () => {
    test("should correctly detect when file exists vs doesn't exist", async () => {
      const filePath = testFS.getPath("detection-test.txt");

      // First write - should be creation
      const result1 = await writeFile.execute({
        path: filePath,
        content: "First content",
      });

      expect(result1.operation).toBe("created");
      expect(result1.isNewFile).toBe(true);

      // Second write - should be overwrite
      const result2 = await writeFile.execute({
        path: filePath,
        content: "Second content",
      });

      expect(result2.operation).toBe("overwritten");
      expect(result2.isNewFile).toBe(false);
    });

    test("should handle rapid successive writes", async () => {
      const filePath = testFS.getPath("rapid.txt");

      const results = await Promise.all([
        writeFile.execute({ path: filePath, content: "Content 1" }),
        writeFile.execute({ path: filePath, content: "Content 2" }),
        writeFile.execute({ path: filePath, content: "Content 3" }),
      ]);

      // All should succeed
      results.forEach((result) => {
        expect(result.status).toBe("success");
      });

      // Final content should be one of the writes
      const finalContent = await testFS.readFile("rapid.txt");
      expect(["Content 1", "Content 2", "Content 3"]).toContain(finalContent);
    });
  });

  describe("error handling", () => {
    test("should handle file system errors gracefully", async () => {
      // Try to write to an invalid path
      const invalidPath = "/invalid/readonly/path/file.txt";

      const result = await writeFile.execute({
        path: invalidPath,
        content: "test content",
      });

      expect(result.status).toBe("error");
      expect(result.message).toContain("Failed to write file");
      expect(result.operation).toBe("write");
      expect(result.path).toBe(invalidPath);
    });

    test("should handle very long file paths", async () => {
      const longPath = "a".repeat(255) + "/file.txt";

      const result = await writeFile.execute({
        path: longPath,
        content: "content",
      });

      // This might succeed or fail depending on the file system
      expect(result.status).toMatch(/success|error/);
      expect(result.path).toBe(longPath);
    });

    test("should provide helpful error messages", async () => {
      const invalidPath = "\x00invalid\x00path\x00/file.txt";

      const result = await writeFile.execute({
        path: invalidPath,
        content: "content",
      });

      expect(result.status).toBe("error");
      expect(result.message).toContain("Failed to write file");
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    test("should handle files with no extension", async () => {
      const filePath = testFS.getPath("no-extension");
      const content = "File without extension";

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(await testFS.readFile("no-extension")).toBe(content);
    });

    test("should handle files with multiple dots in name", async () => {
      const filePath = testFS.getPath("file.backup.2023.txt");
      const content = "Multiple dots in filename";

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(await testFS.readFile("file.backup.2023.txt")).toBe(content);
    });

    test("should handle hidden files", async () => {
      const filePath = testFS.getPath(".hidden-file");
      const content = "Hidden file content";

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(await testFS.readFile(".hidden-file")).toBe(content);
    });

    test("should handle files in hidden directories", async () => {
      const filePath = testFS.getPath(".hidden-dir/file.txt");
      const content = "File in hidden directory";

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      expect(result.status).toBe("success");
      expect(result.operation).toBe("created");
      expect(await testFS.readFile(".hidden-dir/file.txt")).toBe(content);
    });
  });

  describe("tool metadata", () => {
    test("should have correct tool description", () => {
      expect(writeFile.description).toContain(
        "Writes content to a specified file"
      );
      expect(writeFile.description).toContain(
        "Automatically creates new files or overwrites existing ones"
      );
    });

    test("should have properly defined parameters", () => {
      expect(writeFile.parameters).toBeDefined();
      expect(writeFile.parameters.shape).toHaveProperty("path");
      expect(writeFile.parameters.shape).toHaveProperty("content");

      // Check that path parameter is a ZodString
      const pathParam = writeFile.parameters.shape.path;
      expect(pathParam).toBeDefined();
      expect(pathParam._def.typeName).toBe("ZodString");

      // Check that content parameter is a ZodString
      const contentParam = writeFile.parameters.shape.content;
      expect(contentParam).toBeDefined();
      expect(contentParam._def.typeName).toBe("ZodString");
    });
  });

  describe("performance", () => {
    test("should handle multiple small files efficiently", async () => {
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 50; i++) {
        promises.push(
          writeFile.execute({
            path: testFS.getPath(`perf-${i}.txt`),
            content: `Content for file ${i}`,
          })
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // All should succeed
      results.forEach((result) => {
        expect(result.status).toBe("success");
      });

      // Should complete in reasonable time (adjust as needed)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    test("should handle large content efficiently", async () => {
      const filePath = testFS.getPath("performance-large.txt");
      const largeContent = "x".repeat(1000000); // 1MB

      const startTime = Date.now();
      const result = await writeFile.execute({
        path: filePath,
        content: largeContent,
      });
      const endTime = Date.now();

      expect(result.status).toBe("success");
      expect(result.contentLength).toBe(1000000);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe("return value validation", () => {
    test("should return consistent structure for successful operations", async () => {
      const filePath = testFS.getPath("structure-test.txt");
      const content = "Test content";

      const result = await writeFile.execute({
        path: filePath,
        content,
      });

      // Verify all expected properties exist
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("operation");
      expect(result).toHaveProperty("path");
      expect(result).toHaveProperty("contentLength");
      expect(result).toHaveProperty("isNewFile");

      // Verify types
      expect(typeof result.status).toBe("string");
      expect(typeof result.message).toBe("string");
      expect(typeof result.operation).toBe("string");
      expect(typeof result.path).toBe("string");
      expect(typeof result.contentLength).toBe("number");
      expect(typeof result.isNewFile).toBe("boolean");

      // Verify values
      expect(result.status).toBe("success");
      expect(result.operation).toMatch(/created|overwritten/);
      expect(result.path).toBe(filePath);
      expect(result.contentLength).toBe(content.length);
    });

    test("should return consistent structure for error operations", async () => {
      const invalidPath = "/completely/invalid/readonly/path.txt";

      const result = await writeFile.execute({
        path: invalidPath,
        content: "content",
      });

      // Verify error structure
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("operation");
      expect(result).toHaveProperty("path");

      // Verify types
      expect(typeof result.status).toBe("string");
      expect(typeof result.message).toBe("string");
      expect(typeof result.operation).toBe("string");
      expect(typeof result.path).toBe("string");

      // Verify values
      expect(result.status).toBe("error");
      expect(result.operation).toBe("write");
      expect(result.path).toBe(invalidPath);
      expect(result.message.length).toBeGreaterThan(0);
    });
  });
});
