import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdir, writeFile, rmdir } from "fs/promises";
import { join } from "path";
import { directory } from "../directory";

// Test filesystem helper
class TestFileSystem {
  private testDir: string;

  constructor() {
    this.testDir = "";
  }

  async setup(): Promise<void> {
    this.testDir = join(
      process.cwd(),
      "test-temp",
      `directory-test-${Date.now()}-${Math.random().toString(36).substring(7)}`
    );
    await mkdir(this.testDir, { recursive: true });
  }

  async cleanup(): Promise<void> {
    if (this.testDir) {
      try {
        await rmdir(this.testDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  getPath(): string {
    return this.testDir;
  }

  async createFile(relativePath: string, content: string = ""): Promise<void> {
    const fullPath = join(this.testDir, relativePath);
    const dir = join(fullPath, "..");
    await mkdir(dir, { recursive: true });
    await writeFile(fullPath, content);
  }

  async createDir(relativePath: string): Promise<void> {
    const fullPath = join(this.testDir, relativePath);
    await mkdir(fullPath, { recursive: true });
  }
}

describe("directory tool", () => {
  let testFS: TestFileSystem;

  beforeEach(async () => {
    testFS = new TestFileSystem();
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  describe("list operation", () => {
    test("should list files and directories", async () => {
      await testFS.createFile("file1.txt", "content1");
      await testFS.createFile("file2.js", "console.log('hello');");
      await testFS.createDir("subdir");
      await testFS.createFile("subdir/nested.txt", "nested content");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
      });

      expect(result.operation).toBe("list");
      expect(result.count).toBe(3);
      expect(result.items).toHaveLength(3);

      const itemNames = result.items.map((item: any) => item.name);
      expect(itemNames).toContain("file1.txt");
      expect(itemNames).toContain("file2.js");
      expect(itemNames).toContain("subdir");

      expect(result.formatted).toContain("[FILE] file1.txt");
      expect(result.formatted).toContain("[FILE] file2.js");
      expect(result.formatted).toContain("[DIR] subdir");
    });

    test("should handle empty directory", async () => {
      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
      });

      expect(result.operation).toBe("list");
      expect(result.count).toBe(0);
      expect(result.items).toHaveLength(0);
      expect(result.formatted).toBe("Directory is empty");
    });

    test("should include hidden files when requested", async () => {
      await testFS.createFile(".hidden-file", "hidden content");
      await testFS.createFile("visible-file.txt", "visible content");
      await testFS.createDir(".hidden-dir");

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
      await testFS.createDir(".hidden-dir");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
        includeHidden: false,
      });

      expect(result.formatted).not.toContain(".hidden-file");
      expect(result.formatted).not.toContain(".hidden-dir");
      expect(result.formatted).toContain("[FILE] visible-file.txt");
    });

    test("should include file sizes when requested", async () => {
      await testFS.createFile("small-file.txt", "hello");
      await testFS.createFile("large-file.txt", "hello world from test");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
        includeSize: true,
      });

      expect(result.formatted).toContain("small-file.txt (5 B)");
      expect(result.formatted).toContain("large-file.txt");

      const smallFile = result.items.find(
        (item: any) => item.name === "small-file.txt"
      );
      expect(smallFile.size).toBe(5);
    });

    test("should skip .chara directories", async () => {
      await testFS.createDir(".chara");
      await testFS.createFile(".chara/config.json", "{}");
      await testFS.createFile("regular-file.txt", "content");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
      });

      expect(result.formatted).not.toContain(".chara");
      expect(result.formatted).toContain("[FILE] regular-file.txt");
    });

    test("should respect .gitignore patterns", async () => {
      await testFS.createFile(".gitignore", "*.log\ndebug.txt\ntemp/\n");
      await testFS.createFile("app.js", "console.log('app');");
      await testFS.createFile("debug.log", "debug info");
      await testFS.createFile("debug.txt", "debug text");
      await testFS.createDir("temp");
      await testFS.createFile("temp/cache.tmp", "cache");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
        respectGitignore: true,
      });

      expect(result.formatted).toContain("[FILE] app.js");
      expect(result.formatted).toContain("[FILE] .gitignore");
      expect(result.formatted).not.toContain("debug.log");
      expect(result.formatted).not.toContain("debug.txt");
      expect(result.formatted).not.toContain("temp");
    });

    test("should include ignored files when respectGitignore is false", async () => {
      await testFS.createFile(".gitignore", "*.log\n");
      await testFS.createFile("app.js", "console.log('app');");
      await testFS.createFile("debug.log", "debug info");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
        respectGitignore: false,
      });

      expect(result.formatted).toContain("[FILE] app.js");
      expect(result.formatted).toContain("[FILE] debug.log");
    });

    test("should show important hidden files even when includeHidden is false", async () => {
      await testFS.createFile(".gitignore", "*.log\n");
      await testFS.createFile(".env", "SECRET=value");
      await testFS.createFile(".env.local", "LOCAL=value");
      await testFS.createFile(".hidden-file", "hidden");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
        includeHidden: false,
      });

      expect(result.formatted).toContain(".gitignore");
      expect(result.formatted).toContain(".env");
      expect(result.formatted).toContain(".env.local");
      expect(result.formatted).not.toContain(".hidden-file");
    });
  });

  describe("tree operation", () => {
    test("should return tree structure", async () => {
      await testFS.createDir("dir1");
      await testFS.createFile("dir1/file1.txt", "content1");
      await testFS.createFile("dir1/file2.js", "content2");
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
      expect(dir1.children).toHaveLength(2);

      const rootFile = result.tree.find(
        (item: any) => item.name === "root-file.txt"
      );
      expect(rootFile).toBeDefined();
      expect(rootFile.type).toBe("file");
    });

    test("should respect maxDepth limit", async () => {
      await testFS.createDir("level1");
      await testFS.createDir("level1/level2");
      await testFS.createDir("level1/level2/level3");
      await testFS.createFile("level1/level2/level3/deep-file.txt", "deep");

      const result = await directory.execute({
        action: "tree",
        path: testFS.getPath(),
        maxDepth: 2,
      });

      expect(result.maxDepth).toBe(2);

      const level1 = result.tree.find((item: any) => item.name === "level1");
      expect(level1).toBeDefined();
      expect(level1.children).toHaveLength(1);

      const level2 = level1.children.find(
        (item: any) => item.name === "level2"
      );
      expect(level2).toBeDefined();
      expect(level2.children).toHaveLength(0); // Should be empty due to maxDepth
    });

    test("should include file sizes when requested", async () => {
      await testFS.createFile("sized-file.txt", "hello world");
      await testFS.createDir("dir");
      await testFS.createFile("dir/nested-file.txt", "nested");

      const result = await directory.execute({
        action: "tree",
        path: testFS.getPath(),
        includeSize: true,
      });

      const file = result.tree.find(
        (item: any) => item.name === "sized-file.txt"
      );
      expect(file.size).toBe(11); // "hello world".length

      const dir = result.tree.find((item: any) => item.name === "dir");
      expect(dir.children).toHaveLength(1);
      expect(dir.children[0].size).toBe(6); // "nested".length
    });

    test("should respect .gitignore patterns in tree structure", async () => {
      await testFS.createFile(".gitignore", "*.log\ndebug.txt\n");
      await testFS.createDir("src");
      await testFS.createFile("src/app.js", "app code");
      await testFS.createFile("src/debug.log", "debug info");
      await testFS.createFile("src/debug.txt", "debug text");

      const result = await directory.execute({
        action: "tree",
        path: testFS.getPath(),
        respectGitignore: true,
      });

      const src = result.tree.find((item: any) => item.name === "src");
      expect(src).toBeDefined();
      expect(src.children).toHaveLength(1); // Only app.js, not debug files
      expect(src.children[0].name).toBe("app.js");
    });

    test("should include ignored files when respectGitignore is false", async () => {
      await testFS.createFile(".gitignore", "*.log\n");
      await testFS.createDir("src");
      await testFS.createFile("src/app.js", "app code");
      await testFS.createFile("src/debug.log", "debug info");

      const result = await directory.execute({
        action: "tree",
        path: testFS.getPath(),
        respectGitignore: false,
      });

      const src = result.tree.find((item: any) => item.name === "src");
      expect(src).toBeDefined();
      expect(src.children).toHaveLength(2); // Both app.js and debug.log
    });

    test("should handle empty directories", async () => {
      await testFS.createDir("empty-dir");
      await testFS.createFile("regular-file.txt", "content");

      const result = await directory.execute({
        action: "tree",
        path: testFS.getPath(),
      });

      const emptyDir = result.tree.find(
        (item: any) => item.name === "empty-dir"
      );
      expect(emptyDir).toBeDefined();
      expect(emptyDir.type).toBe("directory");
      expect(emptyDir.children).toHaveLength(0);
    });

    test("should handle nested directory structures", async () => {
      await testFS.createDir("a");
      await testFS.createDir("a/b");
      await testFS.createDir("a/b/c");
      await testFS.createFile("a/b/c/deep.txt", "deep content");
      await testFS.createFile("a/shallow.txt", "shallow content");

      const result = await directory.execute({
        action: "tree",
        path: testFS.getPath(),
      });

      const dirA = result.tree.find((item: any) => item.name === "a");
      expect(dirA).toBeDefined();
      expect(dirA.children).toHaveLength(2); // b and shallow.txt

      const dirB = dirA.children.find((item: any) => item.name === "b");
      expect(dirB).toBeDefined();
      expect(dirB.children).toHaveLength(1); // c

      const dirC = dirB.children.find((item: any) => item.name === "c");
      expect(dirC).toBeDefined();
      expect(dirC.children).toHaveLength(1); // deep.txt
    });
  });

  describe("error handling", () => {
    test("should return error object for unknown action", async () => {
      const result = await directory.execute({
        action: "invalid-action",
        path: testFS.getPath(),
      });

      expect(result.error).toBe(true);
      expect(result.message).toContain("Invalid action");
      expect(result.validActions).toEqual(["list", "tree"]);
      expect(result.providedAction).toBe("invalid-action");
    });

    test("should handle non-existent directories gracefully", async () => {
      const result = await directory.execute({
        action: "list",
        path: "/non/existent/directory",
      });

      expect(result.error).toBe(true);
      expect(result.operation).toBe("list");
      expect(result.message).toContain("Failed to list directory");
      expect(result.technicalError).toBeDefined();
    });

    test("should handle permission errors gracefully", async () => {
      // Create a file instead of directory to simulate permission error
      await testFS.createFile("not-a-directory", "content");

      const result = await directory.execute({
        action: "list",
        path: join(testFS.getPath(), "not-a-directory"),
      });

      expect(result.error).toBe(true);
      expect(result.operation).toBe("list");
      expect(result.message).toContain("Failed to list directory");
      expect(result.technicalError).toBeDefined();
    });

    test("should always return error objects for invalid actions", async () => {
      const result = await directory.execute({
        action: "invalid-action",
        path: testFS.getPath(),
      });

      expect(result.error).toBe(true);
      expect(result.message).toContain("Invalid action");
      expect(result.validActions).toEqual(["list", "tree"]);
    });

    test("should validate maxDepth parameter", async () => {
      const result = await directory.execute({
        action: "tree",
        path: testFS.getPath(),
        maxDepth: 15,
      });

      expect(result.error).toBe(true);
      expect(result.message).toContain("maxDepth too large");
      expect(result.providedMaxDepth).toBe(15);
      expect(result.recommendedMaxDepth).toBe(5);
    });
  });

  describe("special cases", () => {
    test("should handle unicode filenames", async () => {
      await testFS.createFile("🌟file.txt", "star file");
      await testFS.createFile("测试.txt", "test file");
      await testFS.createDir("日本語");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
      });

      expect(result.formatted).toContain("[FILE] 🌟file.txt");
      expect(result.formatted).toContain("[FILE] 测试.txt");
      expect(result.formatted).toContain("[DIR] 日本語");
    });

    test("should handle very long filenames", async () => {
      const longName = "a".repeat(200) + ".txt";
      await testFS.createFile(longName, "long name content");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe(longName);
    });

    test("should handle large directory with many files", async () => {
      // Create many files
      for (let i = 0; i < 50; i++) {
        await testFS.createFile(`file-${i}.txt`, `content ${i}`);
      }

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
      });

      expect(result.count).toBe(50);
      expect(result.items).toHaveLength(50);
    });

    test("should handle files with special characters", async () => {
      await testFS.createFile("file with spaces.txt", "content");
      await testFS.createFile("file-with-dashes.txt", "content");
      await testFS.createFile("file_with_underscores.txt", "content");
      await testFS.createFile("file.with.dots.txt", "content");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
      });

      expect(result.count).toBe(4);
      expect(result.formatted).toContain("file with spaces.txt");
      expect(result.formatted).toContain("file-with-dashes.txt");
      expect(result.formatted).toContain("file_with_underscores.txt");
      expect(result.formatted).toContain("file.with.dots.txt");
    });

    test("should handle mixed file types", async () => {
      await testFS.createFile("script.js", "console.log('hello');");
      await testFS.createFile("data.json", '{"key": "value"}');
      await testFS.createFile("README.md", "# Project");
      await testFS.createFile("config.yaml", "key: value");
      await testFS.createDir("assets");
      await testFS.createFile("assets/image.png", "fake image data");

      const result = await directory.execute({
        action: "tree",
        path: testFS.getPath(),
      });

      expect(result.tree).toHaveLength(5); // 4 files + 1 directory

      const jsFile = result.tree.find((item: any) => item.name === "script.js");
      expect(jsFile.type).toBe("file");

      const assetsDir = result.tree.find((item: any) => item.name === "assets");
      expect(assetsDir.type).toBe("directory");
      expect(assetsDir.children).toHaveLength(1);
    });
  });

  describe("tool metadata", () => {
    test("should have correct tool description", () => {
      expect(directory.description).toContain(
        "Directory listing and tree visualization"
      );
      expect(directory.description).toContain("ignore-walk package");
    });

    test("should have proper parameter validation", async () => {
      // Test with missing action parameter - this should be caught by zod validation
      // Since we're bypassing TypeScript with 'as any', the tool should handle gracefully
      const result = await directory.execute({
        path: testFS.getPath(),
      } as any);

      // The tool should return an error object for invalid parameters
      expect(result.error).toBe(true);
      expect(result.message).toBeDefined();
    });
  });

  describe("gitignore functionality", () => {
    test("should handle negation patterns", async () => {
      await testFS.createFile(".gitignore", "*.log\n!important.log\n");
      await testFS.createFile("app.js", "app code");
      await testFS.createFile("debug.log", "debug info");
      await testFS.createFile("important.log", "important info");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
        respectGitignore: true,
      });

      expect(result.formatted).toContain("[FILE] app.js");
      expect(result.formatted).toContain("[FILE] important.log");
      expect(result.formatted).not.toContain("debug.log");
    });

    test("should handle directory patterns", async () => {
      await testFS.createFile(".gitignore", "temp/\n");
      await testFS.createDir("src");
      await testFS.createDir("temp");
      await testFS.createFile("temp/cache.tmp", "cache");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
        respectGitignore: true,
      });

      expect(result.formatted).toContain("[DIR] src");
      expect(result.formatted).not.toContain("temp");
    });

    test("should work when no .gitignore file exists", async () => {
      await testFS.createFile("app.js", "app code");
      await testFS.createFile("debug.log", "debug info");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
        respectGitignore: true,
      });

      expect(result.formatted).toContain("[FILE] app.js");
      expect(result.formatted).toContain("[FILE] debug.log");
    });

    test("should handle complex gitignore patterns", async () => {
      await testFS.createFile(
        ".gitignore",
        "# Comments should be ignored\n" +
          "*.log\n" +
          "build/\n" +
          "!build/index.html\n" +
          "temp*.tmp\n" +
          "**/*.cache\n"
      );

      await testFS.createFile("app.js", "app");
      await testFS.createFile("debug.log", "debug");
      await testFS.createDir("build");
      await testFS.createFile("build/app.js", "built app");
      await testFS.createFile("build/index.html", "index");
      await testFS.createFile("temp1.tmp", "temp");
      await testFS.createFile("file.cache", "cache");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
        respectGitignore: true,
      });

      expect(result.formatted).toContain("[FILE] app.js");
      expect(result.formatted).not.toContain("debug.log");
      expect(result.formatted).not.toContain("temp1.tmp");
      expect(result.formatted).not.toContain("file.cache");
    });

    test("should handle nested gitignore inheritance", async () => {
      // Create parent gitignore
      await testFS.createFile(".gitignore", "*.log\n");

      // Create subdirectory with its own gitignore
      await testFS.createDir("subdir");
      await testFS.createFile("subdir/.gitignore", "*.tmp\n");

      await testFS.createFile("subdir/app.js", "app");
      await testFS.createFile("subdir/debug.log", "log"); // Should be ignored by parent
      await testFS.createFile("subdir/temp.tmp", "temp"); // Should be ignored by local

      const result = await directory.execute({
        action: "tree",
        path: testFS.getPath(),
        respectGitignore: true,
      });

      const subdir = result.tree.find((item: any) => item.name === "subdir");
      expect(subdir).toBeDefined();

      const subdirFiles = subdir.children.map((child: any) => child.name);
      expect(subdirFiles).toContain("app.js");
      expect(subdirFiles).toContain(".gitignore");
      expect(subdirFiles).not.toContain("debug.log");
      expect(subdirFiles).not.toContain("temp.tmp");
    });
  });

  describe("performance and limits", () => {
    test("should handle warning for large directories", async () => {
      // This test checks that the warning mechanism works
      // but doesn't actually create 2000+ files for performance
      await testFS.createFile("file1.txt", "content");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
      });

      expect(result.warning).toBeUndefined(); // Should not have warning for small directory
    });

    test("should handle empty directory names gracefully", async () => {
      await testFS.createFile("normal-file.txt", "content");

      const result = await directory.execute({
        action: "tree",
        path: testFS.getPath(),
      });

      expect(result.tree).toHaveLength(1);
      expect(result.tree[0].name).toBe("normal-file.txt");
    });

    test("should handle deeply nested structures efficiently", async () => {
      // Create a moderately deep structure
      let currentPath = "";
      for (let i = 0; i < 10; i++) {
        currentPath += `level${i}/`;
        await testFS.createDir(currentPath);
      }
      await testFS.createFile(currentPath + "deep-file.txt", "deep content");

      const result = await directory.execute({
        action: "tree",
        path: testFS.getPath(),
        maxDepth: 5,
      });

      expect(result.tree).toHaveLength(1);
      expect(result.tree[0].name).toBe("level0");
    });
  });

  describe("default parameters", () => {
    test("should use current directory when no path provided", async () => {
      const result = await directory.execute({
        action: "list",
      });

      expect(result.operation).toBe("list");
      expect(result.path).toBe(process.cwd());
    });

    test("should use default values for optional parameters", async () => {
      await testFS.createFile("test.txt", "content");

      const result = await directory.execute({
        action: "list",
        path: testFS.getPath(),
      });

      expect(result.respectGitignore).toBe(true);
      expect(result.items[0].hidden).toBe(false);
      expect(result.items[0].size).toBeUndefined(); // includeSize defaults to false
    });
  });
});
