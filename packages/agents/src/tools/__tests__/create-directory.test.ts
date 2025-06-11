import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createDirectory } from "../create-directory";
import { createTestFS } from "./test-utils";
import { stat } from "fs/promises";

describe("createDirectory tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  test("should create directory successfully", async () => {
    const dirPath = testFS.getPath("new-directory");

    const result = await createDirectory.execute({ path: dirPath });

    expect(result.status).toBe("success");
    expect(result.message).toContain("Successfully created directory");
    expect(result.message).toContain(dirPath);

    // Verify directory exists
    const stats = await stat(dirPath);
    expect(stats.isDirectory()).toBe(true);
  });

  test("should create nested directories", async () => {
    const nestedPath = testFS.getPath("level1/level2/level3");

    const result = await createDirectory.execute({ path: nestedPath });

    expect(result.status).toBe("success");
    expect(result.message).toContain("Successfully created directory");

    // Verify all levels exist
    const level1Stats = await stat(testFS.getPath("level1"));
    const level2Stats = await stat(testFS.getPath("level1/level2"));
    const level3Stats = await stat(testFS.getPath("level1/level2/level3"));

    expect(level1Stats.isDirectory()).toBe(true);
    expect(level2Stats.isDirectory()).toBe(true);
    expect(level3Stats.isDirectory()).toBe(true);
  });

  test("should handle existing directory gracefully", async () => {
    const dirPath = testFS.getPath("existing-dir");

    // Create directory first time
    const firstResult = await createDirectory.execute({ path: dirPath });
    expect(firstResult.status).toBe("success");

    // Create same directory again
    const secondResult = await createDirectory.execute({ path: dirPath });
    expect(secondResult.status).toBe("success");
    expect(secondResult.message).toContain("Successfully created directory");

    // Verify directory still exists
    const stats = await stat(dirPath);
    expect(stats.isDirectory()).toBe(true);
  });

  test("should create directory with special characters in name", async () => {
    const specialDirPath = testFS.getPath("special-dir_with.chars");

    const result = await createDirectory.execute({ path: specialDirPath });

    expect(result.status).toBe("success");

    const stats = await stat(specialDirPath);
    expect(stats.isDirectory()).toBe(true);
  });

  test("should create multiple nested directories in parallel", async () => {
    const paths = [
      testFS.getPath("parallel1/sub1/subsub1"),
      testFS.getPath("parallel2/sub2/subsub2"),
      testFS.getPath("parallel3/sub3/subsub3")
    ];

    const results = await Promise.all(
      paths.map(path => createDirectory.execute({ path }))
    );

    // All should succeed
    results.forEach(result => {
      expect(result.status).toBe("success");
    });

    // All directories should exist
    for (const path of paths) {
      const stats = await stat(path);
      expect(stats.isDirectory()).toBe(true);
    }
  });

  test("should create deep nested structure", async () => {
    const deepPath = testFS.getPath("a/b/c/d/e/f/g/h/i/j");

    const result = await createDirectory.execute({ path: deepPath });

    expect(result.status).toBe("success");

    // Verify deep structure exists
    const stats = await stat(deepPath);
    expect(stats.isDirectory()).toBe(true);
  });

  test("should handle relative paths", async () => {
    const currentDir = process.cwd();
    process.chdir(testFS.getPath());

    try {
      const result = await createDirectory.execute({ path: "relative-dir" });

      expect(result.status).toBe("success");

      const stats = await stat(testFS.getPath("relative-dir"));
      expect(stats.isDirectory()).toBe(true);
    } finally {
      process.chdir(currentDir);
    }
  });

  test("should create directory with spaces in name", async () => {
    const spacedDirPath = testFS.getPath("directory with spaces");

    const result = await createDirectory.execute({ path: spacedDirPath });

    expect(result.status).toBe("success");

    const stats = await stat(spacedDirPath);
    expect(stats.isDirectory()).toBe(true);
  });

  test("should handle creating directory in non-writable location gracefully", async () => {
    // Try to create directory in root (should fail on most systems without sudo)
    const restrictedPath = "/root/test-directory";

    await expect(createDirectory.execute({ path: restrictedPath }))
      .rejects.toThrow("Failed to create directory");
  });

  test("should create directory with numeric name", async () => {
    const numericDirPath = testFS.getPath("12345");

    const result = await createDirectory.execute({ path: numericDirPath });

    expect(result.status).toBe("success");

    const stats = await stat(numericDirPath);
    expect(stats.isDirectory()).toBe(true);
  });

  test("should have correct tool metadata", () => {
    expect(createDirectory.description).toBe("Create a new directory or ensure a directory exists. Can create nested directories.");
    expect(createDirectory.parameters).toBeDefined();
  });

  test("should handle creating directory with same name as existing file", async () => {
    const conflictPath = testFS.getPath("conflict");

    // Create a file first
    await testFS.createFile("conflict", "file content");

    // Try to create directory with same name
    await expect(createDirectory.execute({ path: conflictPath }))
      .rejects.toThrow("Failed to create directory");
  });

  test("should create directory tree with mixed existing and new paths", async () => {
    // Create partial structure first
    await createDirectory.execute({ path: testFS.getPath("existing/sub1") });

    // Now create a deeper structure that includes existing parts
    const result = await createDirectory.execute({
      path: testFS.getPath("existing/sub1/new/deeper")
    });

    expect(result.status).toBe("success");

    const stats = await stat(testFS.getPath("existing/sub1/new/deeper"));
    expect(stats.isDirectory()).toBe(true);
  });

  test("should handle empty string path", async () => {
    await expect(createDirectory.execute({ path: "" }))
      .rejects.toThrow();
  });

  test("should create directory and verify .gitkeep file is created", async () => {
    const dirPath = testFS.getPath("gitkeep-test");

    const result = await createDirectory.execute({ path: dirPath });

    expect(result.status).toBe("success");

    // Verify .gitkeep file exists
    expect(await testFS.fileExists("gitkeep-test/.gitkeep")).toBe(true);
  });
});
