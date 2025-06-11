import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { readFile } from "../read-file";
import { createTestFS } from "./test-utils";

describe("readFile tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  test("should read file content successfully", async () => {
    const content = "Hello, World!";
    const filePath = await testFS.createFile("test.txt", content);

    const result = await readFile.execute({ path: filePath });

    expect(result).toBe(content);
  });

  test("should read empty file", async () => {
    const filePath = await testFS.createFile("empty.txt", "");

    const result = await readFile.execute({ path: filePath });

    expect(result).toBe("");
  });

  test("should read file with special characters", async () => {
    const content = "Special chars: éñü 🚀 \n\t<>&\"'";
    const filePath = await testFS.createFile("special.txt", content);

    const result = await readFile.execute({ path: filePath });

    expect(result).toBe(content);
  });

  test("should read multiline file", async () => {
    const content = "Line 1\nLine 2\nLine 3\n";
    const filePath = await testFS.createFile("multiline.txt", content);

    const result = await readFile.execute({ path: filePath });

    expect(result).toBe(content);
  });

  test("should read JSON file", async () => {
    const content = '{"name": "test", "value": 123}';
    const filePath = await testFS.createFile("data.json", content);

    const result = await readFile.execute({ path: filePath });

    expect(result).toBe(content);
  });

  test("should throw error for non-existent file", async () => {
    const nonExistentPath = testFS.getPath("does-not-exist.txt");

    await expect(readFile.execute({ path: nonExistentPath })).rejects.toThrow();
  });

  test("should throw error when trying to read directory", async () => {
    const dirPath = await testFS.createDir("test-dir");

    await expect(readFile.execute({ path: dirPath })).rejects.toThrow();
  });

  test("should have correct tool metadata", () => {
    expect(readFile.description).toBe("Read information from a file");
    expect(readFile.parameters).toBeDefined();
  });

  test("should read large file", async () => {
    const largeContent = "x".repeat(10000);
    const filePath = await testFS.createFile("large.txt", largeContent);

    const result = await readFile.execute({ path: filePath });

    expect(result).toBe(largeContent);
    expect(result.length).toBe(10000);
  });

  test("should preserve line endings", async () => {
    const content = "Line 1\r\nLine 2\r\nLine 3";
    const filePath = await testFS.createFile("windows.txt", content);

    const result = await readFile.execute({ path: filePath });

    expect(result).toBe(content);
  });
});
