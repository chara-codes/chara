import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { directory } from "../directory";
import { createTestFS } from "./test-utils";
import { mkdir } from "node:fs/promises";

describe("directory tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  describe("current operation", () => {
    test("should return current working directory", async () => {
      const result = await directory.execute({
        action: "current",
      });

      expect(result.operation).toBe("current");
      expect(result.path).toBe(process.cwd());
      expect(result.absolutePath).toBe(process.cwd());
    });
  });

  describe("create operation", () => {
    test("should create directory successfully", async () => {
      const dirPath = testFS.getPath("new-directory");

      const result = await directory.execute({
        action: "create",
        path: dirPath,
      });

      expect(result.operation).toBe("create");
      expect(result.path).toBe(dirPath);
      expect(result.message).toContain("Successfully created directory");

      // Verify directory exists
      expect(await testFS.fileExists("new-directory")).toBe(true);
    });

    test("should create nested directories", async () => {
      const nestedPath = testFS.getPath("level1/level2/level3");

      const result = await directory.execute({
        action: "create",
        path: nestedPath,
      });

      expect(result.operation).toBe("create");
      expect(result.path).toBe(nestedPath);

      // Verify all levels exist
      expect(await testFS.fileExists("level1")).toBe(true);
      expect(await testFS.fileExists("level1/level2")).toBe(true);
      expect(await testFS.fileExists("level1/level2/level3")).toBe(true);
    });

    test("should throw error when path is not provided", async () => {
      await expect(
        directory.execute({
          action: "create",
        }),
      ).rejects.toThrow("Path is required for create operation");
    });
  });

  describe("list operation", () => {
    test("should list files and directories", async () => {
      await testFS.createFile("file1.txt", "content1");
      await testFS.createFile("file2.js", "content2");
      await mkdir(testFS.getPath("subdir1"));
      await mkdir(testFS.getPath("subdir2"));

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
      });

      expect(result.operation).toBe("list");
      expect(result.count).toBe(4);
      expect(result.formatted).toContain("[FILE] file1.txt");
      expect(result.formatted).toContain("[FILE] file2.js");
      expect(result.formatted).toContain("[DIR] subdir1");
      expect(result.formatted).toContain("[DIR] subdir2");
    });

    test("should handle empty directory", async () => {
      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
      });

      expect(result.operation).toBe("list");
      expect(result.count).toBe(0);
      expect(result.formatted).toBe("Directory is empty");
    });

    test("should include hidden files when requested", async () => {
      await testFS.createFile(".hidden-file", "hidden content");
      await testFS.createFile("visible-file.txt", "visible content");
      await mkdir(testFS.getPath(".hidden-dir"));

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
        includeHidden: true,
      });

      expect(result.formatted).toContain("[FILE] .hidden-file (hidden)");
      expect(result.formatted).toContain("[FILE] visible-file.txt");
      expect(result.formatted).toContain("[DIR] .hidden-dir (hidden)");
    });

    test("should exclude hidden files by default", async () => {
      await testFS.createFile(".hidden-file", "hidden content");
      await testFS.createFile("visible-file.txt", "visible content");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
        includeHidden: false,
      });

      expect(result.formatted).not.toContain(".hidden-file");
      expect(result.formatted).toContain("[FILE] visible-file.txt");
    });

    test("should include file sizes when requested", async () => {
      await testFS.createFile("small.txt", "hello");
      await testFS.createFile("large.txt", "x".repeat(1000));

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
        includeSize: true,
      });

      expect(result.formatted).toContain("small.txt (5 B)");
      expect(result.formatted).toContain("large.txt (1000 B)");
    });

    test("should skip .chara directories", async () => {
      await mkdir(testFS.getPath(".chara"));
      await testFS.createFile(".chara/config.json", "{}");
      await testFS.createFile("regular-file.txt", "content");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
        includeHidden: true,
      });

      expect(result.formatted).not.toContain(".chara");
      expect(result.formatted).toContain("[FILE] regular-file.txt");
    });
  });

  describe("tree operation", () => {
    test("should return tree structure", async () => {
      await mkdir(testFS.getPath("dir1"));
      await testFS.createFile("dir1/file1.txt", "content1");
      await mkdir(testFS.getPath("dir1/subdir"));
      await testFS.createFile("dir1/subdir/file2.txt", "content2");
      await testFS.createFile("root-file.txt", "root content");

      const result = await directory.execute({
        action: "tree",
        path: testFS.getPath(),
      });

      expect(result.operation).toBe("tree");
      expect(result.tree).toHaveLength(2); // dir1 and root-file.txt

      const dir1 = result.tree.find((item: any) => item.name === "dir1");
      expect(dir1).toBeDefined();
      expect(dir1.type).toBe("directory");
      expect(dir1.children).toHaveLength(2); // file1.txt and subdir

      const subdir = dir1.children.find((item: any) => item.name === "subdir");
      expect(subdir).toBeDefined();
      expect(subdir.children).toHaveLength(1); // file2.txt
    });

    test("should respect maxDepth limit", async () => {
      await mkdir(testFS.getPath("level1"));
      await mkdir(testFS.getPath("level1/level2"));
      await mkdir(testFS.getPath("level1/level2/level3"));
      await testFS.createFile("level1/level2/level3/deep-file.txt", "content");

      const result = await directory.execute({
        action: "tree",
        path: testFS.getPath(),
        maxDepth: 2,
      });

      expect(result.maxDepth).toBe(2);

      const level1 = result.tree.find((item: any) => item.name === "level1");
      expect(level1).toBeDefined();

      const level2 = level1.children.find(
        (item: any) => item.name === "level2",
      );
      expect(level2).toBeDefined();
      expect(level2.children).toHaveLength(0); // Depth limit reached
    });

    test("should include file sizes when requested", async () => {
      await testFS.createFile("sized-file.txt", "hello world");
      await mkdir(testFS.getPath("dir"));
      await testFS.createFile("dir/nested-file.txt", "nested content");

      const result = await directory.execute({
        action: "tree",
        path: testFS.getPath(),
        includeSize: true,
      });

      const file = result.tree.find(
        (item: any) => item.name === "sized-file.txt",
      );
      expect(file.size).toBe(11); // "hello world".length

      const dir = result.tree.find((item: any) => item.name === "dir");
      const nestedFile = dir.children.find(
        (item: any) => item.name === "nested-file.txt",
      );
      expect(nestedFile.size).toBe(14); // "nested content".length
    });

    test("should skip .chara directories in tree", async () => {
      await mkdir(testFS.getPath(".chara"));
      await testFS.createFile(".chara/config.json", "{}");
      await mkdir(testFS.getPath("regular-dir"));
      await testFS.createFile("regular-dir/file.txt", "content");

      const result = await directory.execute({
        action: "tree",
        path: testFS.getPath(),
        includeHidden: true,
      });

      expect(result.tree).toHaveLength(1); // Only regular-dir
      expect(result.tree[0].name).toBe("regular-dir");
    });
  });

  describe("stats operation", () => {
    test("should calculate directory statistics", async () => {
      await testFS.createFile("file1.txt", "content1");
      await testFS.createFile("file2.txt", "content2");
      await mkdir(testFS.getPath("dir1"));
      await mkdir(testFS.getPath("dir2"));
      await testFS.createFile("dir1/nested.txt", "nested");

      const result = await directory.execute({
        action: "stats",
        path: testFS.getPath(),
      });

      expect(result.operation).toBe("stats");
      expect(result.stats.totalFiles).toBe(3);
      expect(result.stats.totalDirectories).toBe(2);
      expect(result.stats.totalSize).toBeGreaterThan(0);
      expect(result.formatted).toContain("Files: 3");
      expect(result.formatted).toContain("Directories: 2");
    });

    test("should count hidden items separately", async () => {
      await testFS.createFile("visible.txt", "content");
      await testFS.createFile(".hidden.txt", "hidden");
      await mkdir(testFS.getPath(".hidden-dir"));

      const result = await directory.execute({
        action: "stats",
        path: testFS.getPath(),
        includeHidden: false,
      });

      expect(result.stats.totalFiles).toBe(1); // Only visible.txt
      expect(result.stats.hiddenItems).toBe(2); // .hidden.txt and .hidden-dir
      expect(result.formatted).toContain("2 (excluded)");
    });

    test("should include hidden items when requested", async () => {
      await testFS.createFile("visible.txt", "content");
      await testFS.createFile(".hidden.txt", "hidden");

      const result = await directory.execute({
        action: "stats",
        path: testFS.getPath(),
        includeHidden: true,
      });

      expect(result.stats.totalFiles).toBe(2); // Both files counted
      expect(result.formatted).toContain("(included)");
    });
  });

  describe("find operation", () => {
    test("should find files matching pattern", async () => {
      await testFS.createFile("test.js", "javascript");
      await testFS.createFile("test.ts", "typescript");
      await testFS.createFile("readme.md", "markdown");
      await mkdir(testFS.getPath("src"));
      await testFS.createFile("src/app.js", "app code");

      const result = await directory.execute({
        action: "find",
        path: testFS.getPath(),
        pattern: "**/*.js",
      });

      expect(result.operation).toBe("find");
      expect(result.count).toBe(2);
      expect(result.formatted).toContain("[FILE] test.js");
      expect(result.formatted).toContain("[FILE] src/app.js");
      expect(result.formatted).not.toContain("test.ts");
      expect(result.formatted).not.toContain("readme.md");
    });

    test("should find directories", async () => {
      await mkdir(testFS.getPath("src"));
      await mkdir(testFS.getPath("tests"));
      await mkdir(testFS.getPath("docs"));
      await testFS.createFile("src/file.js", "code");

      const result = await directory.execute({
        action: "find",
        path: testFS.getPath(),
        pattern: "**/src",
      });

      expect(result.count).toBe(1);
      expect(result.formatted).toContain("[DIR] src");
    });

    test("should respect exclude patterns", async () => {
      await testFS.createFile("keep.js", "keep this");
      await testFS.createFile("exclude.js", "exclude this");
      await testFS.createFile("test.js", "test file");

      const result = await directory.execute({
        action: "find",
        path: testFS.getPath(),
        pattern: "**/*.js",
        excludePatterns: ["exclude*", "test*"],
      });

      expect(result.count).toBe(1);
      expect(result.formatted).toContain("[FILE] keep.js");
      expect(result.formatted).not.toContain("exclude.js");
      expect(result.formatted).not.toContain("test.js");
    });

    test("should handle hidden files based on includeHidden option", async () => {
      await testFS.createFile("visible.js", "visible");
      await testFS.createFile(".hidden.js", "hidden");

      const resultExcluded = await directory.execute({
        action: "find",
        path: testFS.getPath(),
        pattern: "**/*.js",
        includeHidden: false,
      });

      expect(resultExcluded.count).toBe(1);
      expect(resultExcluded.formatted).toContain("visible.js");
      expect(resultExcluded.formatted).not.toContain(".hidden.js");

      const resultIncluded = await directory.execute({
        action: "find",
        path: testFS.getPath(),
        pattern: "**/*.js",
        includeHidden: true,
      });

      expect(resultIncluded.count).toBe(2);
      expect(resultIncluded.formatted).toContain("visible.js");
      expect(resultIncluded.formatted).toContain(".hidden.js");
    });

    test("should automatically exclude common build directories", async () => {
      await mkdir(testFS.getPath("node_modules"));
      await testFS.createFile("node_modules/package.js", "dependency");
      await mkdir(testFS.getPath("dist"));
      await testFS.createFile("dist/bundle.js", "built code");
      await testFS.createFile("app.js", "source code");

      const result = await directory.execute({
        action: "find",
        path: testFS.getPath(),
        pattern: "**/*.js",
      });

      expect(result.formatted).toContain("[FILE] app.js");
      expect(result.formatted).not.toContain("node_modules/package.js");
      expect(result.formatted).not.toContain("dist/bundle.js");
    });

    test("should throw error when pattern is missing", async () => {
      await expect(
        directory.execute({
          action: "find",
          path: testFS.getPath(),
        }),
      ).rejects.toThrow("Pattern is required for find operation");
    });
  });

  describe("error handling", () => {
    test("should throw error for unknown action", async () => {
      await expect(
        directory.execute({
          action: "invalid" as any,
          path: testFS.getPath(),
        }),
      ).rejects.toThrow("Unknown action: invalid");
    });

    test("should handle non-existent directories gracefully", async () => {
      const nonExistentPath = testFS.getPath("does-not-exist");

      await expect(
        directory.execute({
          action: "list",
          path: nonExistentPath,
        }),
      ).rejects.toThrow("Directory operation 'list' failed");
    });

    test("should handle permission errors gracefully", async () => {
      // Try to list a restricted directory
      const restrictedPath = "/root";

      await expect(
        directory.execute({
          action: "list",
          path: restrictedPath,
        }),
      ).rejects.toThrow("Directory operation 'list' failed");
    });
  });

  describe("special cases", () => {
    test("should handle unicode filenames", async () => {
      await testFS.createFile("测试.txt", "test content");
      await testFS.createFile("🚀rocket.txt", "rocket content");
      await mkdir(testFS.getPath("café"));

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
      });

      expect(result.formatted).toContain("测试.txt");
      expect(result.formatted).toContain("🚀rocket.txt");
      expect(result.formatted).toContain("café");
    });

    test("should handle very long filenames", async () => {
      const longName = "a".repeat(200) + ".txt";
      await testFS.createFile(longName, "long filename content");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
      });

      expect(result.formatted).toContain(longName);
    });

    test("should handle concurrent operations", async () => {
      await testFS.createFile("concurrent1.txt", "content1");
      await testFS.createFile("concurrent2.txt", "content2");

      const [result1, result2] = await Promise.all([
        directory.execute({ action: "list", path: testFS.getPath() }),
        directory.execute({ action: "stats", path: testFS.getPath() }),
      ]);

      expect(result1.operation).toBe("list");
      expect(result2.operation).toBe("stats");
      expect(result1.count).toBe(2);
      expect(result2.stats.totalFiles).toBe(2);
    });
  });

  describe("tool metadata", () => {
    test("should have correct tool description", () => {
      expect(directory.description).toContain(
        "Comprehensive directory management tool",
      );
      expect(directory.description).toContain("list");
      expect(directory.description).toContain("tree");
      expect(directory.description).toContain("create");
      expect(directory.description).toContain("current");
      expect(directory.description).toContain("stats");
      expect(directory.description).toContain("find");
    });

    test("should have proper parameter validation", () => {
      expect(directory.parameters).toBeDefined();
    });
  });
});
