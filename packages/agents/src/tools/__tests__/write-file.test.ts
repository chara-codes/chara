import { describe, test, expect, beforeEach, afterEach } from "bun:test";
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

  test("should write file content successfully", async () => {
    const content = "Hello, World!";
    const filePath = testFS.getPath("test.txt");

    const result = await writeFile.execute({ path: filePath, content });

    expect(result.status).toBe("success");
    expect(result.savedFile).toBe(filePath);
    expect(await testFS.readFile("test.txt")).toBe(content);
  });

  test("should write empty file", async () => {
    const content = "";
    const filePath = testFS.getPath("empty.txt");

    const result = await writeFile.execute({ path: filePath, content });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("empty.txt")).toBe(content);
  });

  test("should overwrite existing file", async () => {
    const originalContent = "Original content";
    const newContent = "New content";
    const filePath = await testFS.createFile("overwrite.txt", originalContent);

    const result = await writeFile.execute({ path: filePath, content: newContent });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("overwrite.txt")).toBe(newContent);
    expect(await testFS.readFile("overwrite.txt")).not.toBe(originalContent);
  });

  test("should write file with special characters", async () => {
    const content = "Special chars: éñü 🚀 \n\t<>&\"'";
    const filePath = testFS.getPath("special.txt");

    const result = await writeFile.execute({ path: filePath, content });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("special.txt")).toBe(content);
  });

  test("should write multiline content", async () => {
    const content = "Line 1\nLine 2\nLine 3\n";
    const filePath = testFS.getPath("multiline.txt");

    const result = await writeFile.execute({ path: filePath, content });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("multiline.txt")).toBe(content);
  });

  test("should write JSON content", async () => {
    const content = JSON.stringify({ name: "test", value: 123, array: [1, 2, 3] }, null, 2);
    const filePath = testFS.getPath("data.json");

    const result = await writeFile.execute({ path: filePath, content });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("data.json")).toBe(content);
  });

  test("should create nested directories when writing file", async () => {
    const content = "Nested file content";
    const filePath = testFS.getPath("nested/deep/file.txt");

    const result = await writeFile.execute({ path: filePath, content });

    expect(result.status).toBe("success");
    expect(result.savedFile).toBe(filePath);
    expect(await testFS.fileExists("nested/deep/file.txt")).toBe(true);
    expect(await testFS.readFile("nested/deep/file.txt")).toBe(content);
  });

  test("should write large content", async () => {
    const largeContent = "x".repeat(100000);
    const filePath = testFS.getPath("large.txt");

    const result = await writeFile.execute({ path: filePath, content: largeContent });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("large.txt")).toBe(largeContent);
  });

  test("should preserve line endings", async () => {
    const content = "Line 1\r\nLine 2\r\nLine 3";
    const filePath = testFS.getPath("windows.txt");

    const result = await writeFile.execute({ path: filePath, content });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("windows.txt")).toBe(content);
  });

  test("should write binary-like content", async () => {
    const content = "\x00\x01\x02\x03\xFF";
    const filePath = testFS.getPath("binary.txt");

    const result = await writeFile.execute({ path: filePath, content });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("binary.txt")).toBe(content);
  });

  test("should have correct tool metadata", () => {
    expect(writeFile.description).toBe("Write data to the file, create folder if its not exists");
    expect(writeFile.parameters).toBeDefined();
  });

  test("should handle concurrent writes to different files", async () => {
    const content1 = "Content 1";
    const content2 = "Content 2";
    const filePath1 = testFS.getPath("concurrent1.txt");
    const filePath2 = testFS.getPath("concurrent2.txt");

    const [result1, result2] = await Promise.all([
      writeFile.execute({ path: filePath1, content: content1 }),
      writeFile.execute({ path: filePath2, content: content2 })
    ]);

    expect(result1.status).toBe("success");
    expect(result2.status).toBe("success");
    expect(await testFS.readFile("concurrent1.txt")).toBe(content1);
    expect(await testFS.readFile("concurrent2.txt")).toBe(content2);
  });
});
