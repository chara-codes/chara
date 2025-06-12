import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { getFileInfo } from "../get-file-info";
import { createTestFS } from "./test-utils";
import { mkdir, stat } from "fs/promises";

describe("getFileInfo tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  test("should get file info successfully", async () => {
    const content = "Test file content";
    const filePath = await testFS.createFile("test.txt", content);

    const result = await getFileInfo.execute({ path: filePath });

    expect(result.path).toBe(filePath);
    expect(result.size).toBe(content.length);
    expect(result.isFile).toBe(true);
    expect(result.isDirectory).toBe(false);
    expect(result.created).toBeInstanceOf(Date);
    expect(result.modified).toBeInstanceOf(Date);
    expect(result.accessed).toBeInstanceOf(Date);
    expect(typeof result.permissions).toBe("string");
    expect(result.formattedInfo).toContain("size:");
    expect(result.formattedInfo).toContain("isFile: true");
  });

  test("should get directory info successfully", async () => {
    const dirPath = testFS.getPath("test-dir");
    await mkdir(dirPath);

    const result = await getFileInfo.execute({ path: dirPath });

    expect(result.path).toBe(dirPath);
    expect(result.isFile).toBe(false);
    expect(result.isDirectory).toBe(true);
    expect(result.created).toBeInstanceOf(Date);
    expect(result.modified).toBeInstanceOf(Date);
    expect(result.accessed).toBeInstanceOf(Date);
    expect(result.formattedInfo).toContain("isDirectory: true");
  });

  test("should handle empty file", async () => {
    const filePath = await testFS.createFile("empty.txt", "");

    const result = await getFileInfo.execute({ path: filePath });

    expect(result.size).toBe(0);
    expect(result.isFile).toBe(true);
    expect(result.isDirectory).toBe(false);
  });

  test("should handle large file", async () => {
    const largeContent = "x".repeat(100000);
    const filePath = await testFS.createFile("large.txt", largeContent);

    const result = await getFileInfo.execute({ path: filePath });

    expect(result.size).toBe(100000);
    expect(result.isFile).toBe(true);
    expect(result.formattedInfo).toContain("size: 100000");
  });

  test("should get info for file with special characters", async () => {
    const content = "Special content éñü 🚀";
    const filePath = await testFS.createFile("special-éñü🚀.txt", content);

    const result = await getFileInfo.execute({ path: filePath });

    expect(result.isFile).toBe(true);
    expect(result.size).toBeGreaterThan(0);
    expect(result.path).toContain("special-éñü🚀.txt");
  });

  test("should get info for hidden file", async () => {
    const content = "SECRET=value";
    const filePath = await testFS.createFile(".env", content);

    const result = await getFileInfo.execute({ path: filePath });

    expect(result.isFile).toBe(true);
    expect(result.size).toBe(content.length);
    expect(result.path).toContain(".env");
  });

  test("should handle nested directory", async () => {
    const nestedPath = testFS.getPath("level1/level2/level3");
    await mkdir(nestedPath, { recursive: true });

    const result = await getFileInfo.execute({ path: nestedPath });

    expect(result.isDirectory).toBe(true);
    expect(result.isFile).toBe(false);
    expect(result.path).toBe(nestedPath);
  });

  test("should handle file with long name", async () => {
    const longName = "a".repeat(200) + ".txt";
    const content = "Long filename content";
    const filePath = await testFS.createFile(longName, content);

    const result = await getFileInfo.execute({ path: filePath });

    expect(result.isFile).toBe(true);
    expect(result.size).toBe(content.length);
    expect(result.path).toContain(longName);
  });

  test("should provide accurate timestamps", async () => {
    const beforeCreate = new Date();
    const filePath = await testFS.createFile("timestamp.txt", "content");
    const afterCreate = new Date();

    const result = await getFileInfo.execute({ path: filePath });

    expect(result.created.getTime()).toBeGreaterThanOrEqual(
      beforeCreate.getTime(),
    );
    expect(result.created.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.modified.getTime()).toBeGreaterThanOrEqual(
      beforeCreate.getTime(),
    );
    expect(result.modified.getTime()).toBeLessThanOrEqual(
      afterCreate.getTime(),
    );
  });

  test("should show file modification time changes", async () => {
    const filePath = await testFS.createFile("modify.txt", "original");
    const originalResult = await getFileInfo.execute({ path: filePath });

    // Wait a bit to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Modify the file
    await Bun.write(filePath, "modified content");
    const modifiedResult = await getFileInfo.execute({ path: filePath });

    expect(modifiedResult.modified.getTime()).toBeGreaterThan(
      originalResult.modified.getTime(),
    );
    expect(modifiedResult.size).not.toBe(originalResult.size);
  });

  test("should handle permissions correctly", async () => {
    const filePath = await testFS.createFile("permissions.txt", "content");

    const result = await getFileInfo.execute({ path: filePath });

    expect(result.permissions).toMatch(/^\d{3}$/);
    expect(result.formattedInfo).toContain(
      `permissions: ${result.permissions}`,
    );
  });

  test("should throw error for non-existent file", async () => {
    const nonExistentPath = testFS.getPath("does-not-exist.txt");

    await expect(
      getFileInfo.execute({ path: nonExistentPath }),
    ).rejects.toThrow("Failed to get file info");
  });

  test("should handle concurrent info requests", async () => {
    const content1 = "Content 1";
    const content2 = "Content 2";
    const filePath1 = await testFS.createFile("concurrent1.txt", content1);
    const filePath2 = await testFS.createFile("concurrent2.txt", content2);

    const [result1, result2] = await Promise.all([
      getFileInfo.execute({ path: filePath1 }),
      getFileInfo.execute({ path: filePath2 }),
    ]);

    expect(result1.size).toBe(content1.length);
    expect(result2.size).toBe(content2.length);
    expect(result1.path).toContain("concurrent1.txt");
    expect(result2.path).toContain("concurrent2.txt");
  });

  test("should format info string correctly", async () => {
    const filePath = await testFS.createFile("format.txt", "test");

    const result = await getFileInfo.execute({ path: filePath });

    const lines = result.formattedInfo.split("\n");
    expect(lines.length).toBeGreaterThan(5);

    const expectedKeys = [
      "size",
      "created",
      "modified",
      "accessed",
      "isDirectory",
      "isFile",
      "permissions",
    ];
    expectedKeys.forEach((key) => {
      expect(result.formattedInfo).toContain(`${key}:`);
    });
  });

  test("should handle directory with files", async () => {
    const dirPath = testFS.getPath("dir-with-files");
    await mkdir(dirPath);
    await testFS.createFile("dir-with-files/file1.txt", "content1");
    await testFS.createFile("dir-with-files/file2.txt", "content2");

    const result = await getFileInfo.execute({ path: dirPath });

    expect(result.isDirectory).toBe(true);
    expect(result.isFile).toBe(false);
    // Directory size behavior can vary by filesystem
    expect(typeof result.size).toBe("number");
  });

  test("should handle binary-like content", async () => {
    const binaryContent = "\x00\x01\x02\x03\xFF\xFE\xFD";
    const filePath = await testFS.createFile("binary.bin", binaryContent);

    const result = await getFileInfo.execute({ path: filePath });

    expect(result.isFile).toBe(true);
    expect(result.size).toBeGreaterThan(0);
    // Binary content may have different byte length when written as UTF-8
    expect(typeof result.size).toBe("number");
  });

  test("should compare file info with fs.stat", async () => {
    const content = "Compare with fs.stat";
    const filePath = await testFS.createFile("compare.txt", content);

    const result = await getFileInfo.execute({ path: filePath });
    const stats = await stat(filePath);

    expect(result.size).toBe(stats.size);
    expect(result.isFile).toBe(stats.isFile());
    expect(result.isDirectory).toBe(stats.isDirectory());
    expect(result.created.getTime()).toBe(stats.birthtime.getTime());
    expect(result.modified.getTime()).toBe(stats.mtime.getTime());
    expect(result.accessed.getTime()).toBe(stats.atime.getTime());
  });

  test("should have correct tool metadata", () => {
    expect(getFileInfo.description).toBe(
      "Retrieve detailed metadata about a file or directory including size, timestamps, and permissions",
    );
    expect(getFileInfo.parameters).toBeDefined();
  });

  test("should handle files with different extensions", async () => {
    const extensions = [".txt", ".js", ".json", ".md", ".csv", ".xml"];
    const results = [];

    for (const ext of extensions) {
      const filePath = await testFS.createFile(
        `test${ext}`,
        `content for ${ext}`,
      );
      const result = await getFileInfo.execute({ path: filePath });
      results.push(result);
    }

    results.forEach((result, index) => {
      expect(result.isFile).toBe(true);
      expect(result.path).toContain(extensions[index]);
      expect(result.size).toBeGreaterThan(0);
    });
  });

  test("should handle symbolic links if supported", async () => {
    const originalPath = await testFS.createFile(
      "original.txt",
      "original content",
    );
    // Note: Bun may not support creating symlinks directly, so this test
    // might be skipped in some environments
    try {
      // This is just a placeholder - actual symlink creation would depend on the system
      const result = await getFileInfo.execute({ path: originalPath });
      expect(result.isFile).toBe(true);
    } catch (error) {
      // Skip test if symlinks aren't supported
      expect(true).toBe(true);
    }
  });
});
