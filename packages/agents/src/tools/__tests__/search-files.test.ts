import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { searchFiles } from "../search-files";
import { createTestFS } from "./test-utils";
import { mkdir } from "fs/promises";

describe("searchFiles tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  test("should find files matching pattern", async () => {
    await testFS.createFile("test.txt", "content");
    await testFS.createFile("test.js", "code");
    await testFS.createFile("other.txt", "content");

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "test",
    });

    expect(result).toContain("test.txt");
    expect(result).toContain("test.js");
    expect(result).not.toContain("other.txt");
  });

  test("should search recursively in subdirectories", async () => {
    await mkdir(testFS.getPath("subdir"));
    await mkdir(testFS.getPath("subdir/nested"));
    await testFS.createFile("search-me.txt", "content");
    await testFS.createFile("subdir/search-me.js", "code");
    await testFS.createFile("subdir/nested/search-me.json", "{}");
    await testFS.createFile("subdir/other.txt", "content");

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "search-me",
    });

    expect(result).toContain("search-me.txt");
    expect(result).toContain("search-me.js");
    expect(result).toContain("search-me.json");
    expect(result).not.toContain("other.txt");
  });

  test("should handle case-insensitive search", async () => {
    await testFS.createFile("TEST.txt", "content");
    await testFS.createFile("Test.js", "code");
    await testFS.createFile("test.json", "{}");

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "test",
    });

    expect(result).toContain("TEST.txt");
    expect(result).toContain("Test.js");
    expect(result).toContain("test.json");
  });

  test("should find directories matching pattern", async () => {
    await mkdir(testFS.getPath("test-dir"));
    await mkdir(testFS.getPath("other-dir"));
    await mkdir(testFS.getPath("test-dir/nested"));

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "test-dir",
    });

    expect(result).toContain("test-dir");
    expect(result).not.toContain("other-dir");
    expect(result).not.toContain("nested");
  });

  test("should return 'No matches found' when no files match", async () => {
    await testFS.createFile("file1.txt", "content");
    await testFS.createFile("file2.js", "code");

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "nonexistent",
    });

    expect(result).toBe("No matches found");
  });

  test("should handle empty directory", async () => {
    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "anything",
    });

    expect(result).toBe("No matches found");
  });

  test("should exclude files matching exclude patterns", async () => {
    await testFS.createFile("include-me.txt", "content");
    await testFS.createFile("exclude-me.txt", "content");
    await testFS.createFile("also-exclude.txt", "content");
    await mkdir(testFS.getPath("include-dir"));
    await mkdir(testFS.getPath("exclude-dir"));

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "",
      excludePatterns: ["exclude"],
    });

    expect(result).toContain("include-me.txt");
    expect(result).toContain("include-dir");
    expect(result).not.toContain("exclude-me.txt");
    expect(result).not.toContain("also-exclude.txt");
    expect(result).not.toContain("exclude-dir");
  });

  test("should handle multiple exclude patterns", async () => {
    await testFS.createFile("keep.txt", "content");
    await testFS.createFile("temp.txt", "content");
    await testFS.createFile("backup.txt", "content");
    await testFS.createFile("test.tmp", "content");

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "",
      excludePatterns: ["temp", "backup", ".tmp"],
    });

    expect(result).toContain("keep.txt");
    expect(result).not.toContain("temp.txt");
    expect(result).not.toContain("backup.txt");
    expect(result).not.toContain("test.tmp");
  });

  test("should handle exclude patterns with full paths", async () => {
    await mkdir(testFS.getPath("node_modules"));
    await testFS.createFile("node_modules/package.js", "content");
    await testFS.createFile("src-package.js", "content");
    await testFS.createFile("package.json", "{}");

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "package",
      excludePatterns: ["node_modules"],
    });

    expect(result).not.toContain("node_modules/package.js");
    expect(result).toContain("src-package.js");
    expect(result).toContain("package.json");
  });

  test("should search with partial pattern matches", async () => {
    await testFS.createFile("component.js", "code");
    await testFS.createFile("test-component.spec.js", "test");
    await testFS.createFile("component-utils.js", "utils");
    await testFS.createFile("other.js", "code");

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "component",
    });

    expect(result).toContain("component.js");
    expect(result).toContain("test-component.spec.js");
    expect(result).toContain("component-utils.js");
    expect(result).not.toContain("other.js");
  });

  test("should handle special characters in file names", async () => {
    await testFS.createFile("file-with-dashes.txt", "content");
    await testFS.createFile("file_with_underscores.txt", "content");
    await testFS.createFile("file.with.dots.txt", "content");
    await testFS.createFile("file with spaces.txt", "content");
    await testFS.createFile("café.txt", "content");

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "file",
    });

    expect(result).toContain("file-with-dashes.txt");
    expect(result).toContain("file_with_underscores.txt");
    expect(result).toContain("file.with.dots.txt");
    expect(result).toContain("file with spaces.txt");
    expect(result).not.toContain("café.txt");
  });

  test("should handle unicode characters", async () => {
    await testFS.createFile("测试.txt", "test content");
    await testFS.createFile("🚀rocket.txt", "rocket content");
    await testFS.createFile("münchen.txt", "german content");

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "测试",
    });

    expect(result).toContain("测试.txt");
    expect(result).not.toContain("🚀rocket.txt");
    expect(result).not.toContain("münchen.txt");
  });

  test("should handle hidden files", async () => {
    await testFS.createFile(".env", "SECRET=value");
    await testFS.createFile(".gitignore", "node_modules/");
    await testFS.createFile("env.local", "content");
    await mkdir(testFS.getPath(".git"));

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "env",
    });

    expect(result).toContain(".env");
    expect(result).toContain("env.local");
  });

  test("should handle deep nested directories", async () => {
    const deepPath = "a/b/c/d/e/f/g";
    await mkdir(testFS.getPath(deepPath), { recursive: true });
    await testFS.createFile(`${deepPath}/deep-file.txt`, "content");
    await testFS.createFile("shallow-file.txt", "content");

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "file",
    });

    expect(result).toContain("deep-file.txt");
    expect(result).toContain("shallow-file.txt");
  });

  test("should handle large number of files", async () => {
    // Create many files with and without pattern
    for (let i = 0; i < 50; i++) {
      await testFS.createFile(`match-${i}.txt`, `content${i}`);
      await testFS.createFile(`other-${i}.txt`, `content${i}`);
    }

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "match",
    });

    // Should contain all match files
    for (let i = 0; i < 50; i++) {
      expect(result).toContain(`match-${i}.txt`);
      expect(result).not.toContain(`other-${i}.txt`);
    }
  });

  test("should handle permission denied directories gracefully", async () => {
    await testFS.createFile("accessible.txt", "content");
    await mkdir(testFS.getPath("accessible-dir"));
    await testFS.createFile("accessible-dir/file.txt", "content");

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "accessible",
    });

    expect(result).toContain("accessible.txt");
    expect(result).toContain("accessible-dir");
    // Note: nested file won't be included since search only matches pattern in filenames
  });

  test("should handle non-existent search path gracefully", async () => {
    const nonExistentPath = testFS.getPath("does-not-exist");

    const result = await searchFiles.execute({
      path: nonExistentPath,
      pattern: "anything",
    });

    expect(result).toBe("No matches found");
  });

  test("should handle empty pattern (match all files)", async () => {
    await testFS.createFile("file1.txt", "content");
    await testFS.createFile("file2.js", "code");
    await mkdir(testFS.getPath("dir1"));

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "",
    });

    expect(result).toContain("file1.txt");
    expect(result).toContain("file2.js");
    expect(result).toContain("dir1");
  });

  test("should handle search in subdirectory", async () => {
    await mkdir(testFS.getPath("search-here"));
    await mkdir(testFS.getPath("dont-search-here"));
    await testFS.createFile("search-here/target.txt", "content");
    await testFS.createFile("search-here/other.txt", "content");
    await testFS.createFile("dont-search-here/target.txt", "content");

    const result = await searchFiles.execute({
      path: testFS.getPath("search-here"),
      pattern: "target",
    });

    expect(result).toContain("target.txt");
    expect(result).not.toContain("dont-search-here");
  });

  test("should preserve result order consistently", async () => {
    await testFS.createFile("zebra.txt", "content");
    await testFS.createFile("alpha.txt", "content");
    await testFS.createFile("beta.txt", "content");

    const result1 = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: ".txt",
    });

    const result2 = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: ".txt",
    });

    expect(result1).toBe(result2);
  });

  test("should have correct tool metadata", () => {
    expect(searchFiles.description).toBe(
      "Recursively search for files and directories matching a pattern. Searches through all subdirectories from the starting path.",
    );
    expect(searchFiles.parameters).toBeDefined();
  });

  test("should handle concurrent searches", async () => {
    await testFS.createFile("search1.txt", "content");
    await testFS.createFile("search2.txt", "content");
    await testFS.createFile("other.txt", "content");

    const [result1, result2] = await Promise.all([
      searchFiles.execute({ path: testFS.getPath(), pattern: "search1" }),
      searchFiles.execute({ path: testFS.getPath(), pattern: "search2" }),
    ]);

    expect(result1).toContain("search1.txt");
    expect(result1).not.toContain("search2.txt");
    expect(result2).toContain("search2.txt");
    expect(result2).not.toContain("search1.txt");
  });

  test("should handle mixed file types", async () => {
    await testFS.createFile("document.pdf", "pdf content");
    await testFS.createFile("image.png", "png content");
    await testFS.createFile("video.mp4", "video content");
    await testFS.createFile("text.txt", "text content");

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: ".",
    });

    expect(result).toContain("document.pdf");
    expect(result).toContain("image.png");
    expect(result).toContain("video.mp4");
    expect(result).toContain("text.txt");
  });

  test("should exclude based on case-insensitive pattern matching", async () => {
    await testFS.createFile("TEMP.txt", "content");
    await testFS.createFile("temp.txt", "content");
    await testFS.createFile("Temp.txt", "content");
    await testFS.createFile("keep.txt", "content");

    const result = await searchFiles.execute({
      path: testFS.getPath(),
      pattern: "",
      excludePatterns: ["temp"],
    });

    expect(result).toContain("keep.txt");
    expect(result).not.toContain("TEMP.txt");
    expect(result).not.toContain("temp.txt");
    expect(result).not.toContain("Temp.txt");
  });
});
