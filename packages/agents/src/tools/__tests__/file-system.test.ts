import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { fileSystem } from "../file-system";
import { createTestFS } from "./test-utils";
import { mkdir, stat } from "node:fs/promises";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("fileSystem tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  describe("current operation", () => {
    test("should return current working directory", async () => {
      const result = await fileSystem.execute({
        action: "current",
      });

      expect(result.operation).toBe("current");
      expect(result.path).toBe(process.cwd());
      expect(result.absolutePath).toBe(process.cwd());
    });
  });

  describe("read operation", () => {
    test("should read file contents successfully", async () => {
      const content = "Hello, World!\nThis is a test file.";
      await testFS.createFile("test.txt", content);

      const result = await fileSystem.execute({
        action: "read",
        path: testFS.getPath("test.txt"),
      });

      expect(result.operation).toBe("read");
      expect(result.path).toBe(testFS.getPath("test.txt"));
      expect(result.content).toBe(content);
      expect(result.encoding).toBe("utf-8");
      expect(typeof result.size).toBe("number");
    });

    test("should throw error when path is not provided", async () => {
      await expect(
        fileSystem.execute({
          action: "read",
        })
      ).rejects.toThrow("Path is required for read operation");
    });

    test("should throw error for non-existent file", async () => {
      const nonExistentFile = testFS.getPath("does-not-exist.txt");

      await expect(
        fileSystem.execute({
          action: "read",
          path: nonExistentFile,
        })
      ).rejects.toThrow("Failed to read file");
    });

    test("should throw error when trying to read directory", async () => {
      await testFS.createDir("test-dir");

      await expect(
        fileSystem.execute({
          action: "read",
          path: testFS.getPath("test-dir"),
        })
      ).rejects.toThrow("Path is a directory, not a file");
    });
  });

  describe("list operation", () => {
    test("should list files and directories", async () => {
      await testFS.createFile("file1.txt", "content1");
      await testFS.createFile("file2.js", "content2");
      await mkdir(testFS.getPath("subdir1"));
      await mkdir(testFS.getPath("subdir2"));

      const result = await fileSystem.execute({
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
      const result = await fileSystem.execute({
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

      const result = await fileSystem.execute({
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

      const result = await fileSystem.execute({
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

      const result = await fileSystem.execute({
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

      const result = await fileSystem.execute({
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

      const result = await fileSystem.execute({
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

      const result = await fileSystem.execute({
        action: "tree",
        path: testFS.getPath(),
        maxDepth: 2,
      });

      expect(result.maxDepth).toBe(2);

      const level1 = result.tree.find((item: any) => item.name === "level1");
      expect(level1).toBeDefined();

      const level2 = level1.children.find(
        (item: any) => item.name === "level2"
      );
      expect(level2).toBeDefined();
      expect(level2.children).toHaveLength(0); // Depth limit reached
    });

    test("should include file sizes when requested", async () => {
      await testFS.createFile("sized-file.txt", "hello world");
      await mkdir(testFS.getPath("dir"));
      await testFS.createFile("dir/nested-file.txt", "nested content");

      const result = await fileSystem.execute({
        action: "tree",
        path: testFS.getPath(),
        includeSize: true,
      });

      const file = result.tree.find(
        (item: any) => item.name === "sized-file.txt"
      );
      expect(file.size).toBe(11); // "hello world".length

      const dir = result.tree.find((item: any) => item.name === "dir");
      const nestedFile = dir.children.find(
        (item: any) => item.name === "nested-file.txt"
      );
      expect(nestedFile.size).toBe(14); // "nested content".length
    });
  });

  describe("stats operation", () => {
    test("should calculate directory statistics", async () => {
      await testFS.createFile("file1.txt", "content1");
      await testFS.createFile("file2.txt", "content2");
      await mkdir(testFS.getPath("dir1"));
      await mkdir(testFS.getPath("dir2"));
      await testFS.createFile("dir1/nested.txt", "nested");

      const result = await fileSystem.execute({
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

      const result = await fileSystem.execute({
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

      const result = await fileSystem.execute({
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

      const result = await fileSystem.execute({
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

      const result = await fileSystem.execute({
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

      const result = await fileSystem.execute({
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

    test("should use default pattern when pattern is missing", async () => {
      await testFS.createFile("test.js", "javascript");
      await testFS.createFile("test.ts", "typescript");
      await mkdir(testFS.getPath("src"));
      await testFS.createFile("src/app.js", "app code");

      const result = await fileSystem.execute({
        action: "find",
        path: testFS.getPath(),
      });

      expect(result.operation).toBe("find");
      expect(result.count).toBeGreaterThan(0);
      expect(result.formatted).toContain("[FILE] test.js");
      expect(result.formatted).toContain("[FILE] test.ts");
      expect(result.formatted).toContain("[FILE] src/app.js");
    });

    test("should work with original error scenario - find without pattern", async () => {
      // Simulate the original error scenario from the stream
      await testFS.createFile("space-invaders/game.js", "game logic");
      await testFS.createFile("space-invaders/player.js", "player code");
      await mkdir(testFS.getPath("space-invaders/assets"));
      await testFS.createFile("space-invaders/assets/sprite.png", "image data");

      // This should now work without throwing "Pattern is required for find operation"
      const result = await fileSystem.execute({
        action: "find",
        path: testFS.getPath("space-invaders"),
        includeHidden: false,
        includeSize: false,
        excludePatterns: [],
        respectGitignore: true,
        includeSystem: true,
        includeProject: true,
        returnErrorObjects: false,
      });

      expect(result.operation).toBe("find");
      expect(result.count).toBeGreaterThan(0);
      expect(result.formatted).toContain("[FILE] game.js");
      expect(result.formatted).toContain("[FILE] player.js");
      expect(result.formatted).toContain("[FILE] assets/sprite.png");
    });
  });

  describe("info operation", () => {
    test("should get file info successfully", async () => {
      const content = "Test file content";
      const filePath = await testFS.createFile("test.txt", content);

      const result = await fileSystem.execute({
        action: "info",
        path: filePath,
      });

      expect(result.operation).toBe("info");
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

      const result = await fileSystem.execute({
        action: "info",
        path: dirPath,
      });

      expect(result.operation).toBe("info");
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

      const result = await fileSystem.execute({
        action: "info",
        path: filePath,
      });

      expect(result.size).toBe(0);
      expect(result.isFile).toBe(true);
      expect(result.isDirectory).toBe(false);
    });

    test("should throw error when path is not provided", async () => {
      await expect(
        fileSystem.execute({
          action: "info",
        })
      ).rejects.toThrow("Path is required for info operation");
    });

    test("should handle non-existent file", async () => {
      const nonExistentPath = testFS.getPath("does-not-exist.txt");

      await expect(
        fileSystem.execute({
          action: "info",
          path: nonExistentPath,
        })
      ).rejects.toThrow("Failed to get file info");
    });
  });

  describe("env operation", () => {
    const testDir = "/tmp/test-file-system-env";
    const charaConfigPath = join(testDir, ".chara.json");

    beforeEach(() => {
      // Create test directory
      if (!existsSync(testDir)) {
        require("node:fs").mkdirSync(testDir, { recursive: true });
      }
    });

    afterEach(() => {
      // Clean up test files
      if (existsSync(charaConfigPath)) {
        unlinkSync(charaConfigPath);
      }
    });

    test("should return environment info with system and project data", async () => {
      // Create a test .chara.json file
      const testConfig = {
        dev: "npm run dev",
        info: {
          name: "test-project",
          description: "A test project",
          version: "1.0.0",
          frameworks: ["react", "typescript"],
          tools: ["vite", "eslint"],
          stack: ["frontend"],
          packageManager: "npm",
          scripts: {
            dev: "vite",
            build: "vite build",
          },
          dependencies: ["react", "react-dom"],
          devDependencies: ["typescript", "@types/react"],
          languages: ["typescript", "javascript"],
          projectType: "web",
        },
      };

      writeFileSync(charaConfigPath, JSON.stringify(testConfig, null, 2));

      const result = await fileSystem.execute({
        action: "env",
        workingDir: testDir,
        includeSystem: true,
        includeProject: true,
      });

      // Check basic structure
      expect(result.operation).toBe("env");
      expect(result.workingDirectory).toBe(testDir);
      expect(result.timestamp).toBeDefined();

      // Check project information
      expect(result.project).toBeDefined();
      expect(result.project.hasCharaConfig).toBe(true);
      expect(result.project.dev).toBe("npm run dev");
      expect(result.project.info).toEqual(testConfig.info);
      expect(result.project.files).toBeDefined();

      // Check system information
      expect(result.system).toBeDefined();
      expect(result.system.platform).toBeDefined();
      expect(result.system.architecture).toBeDefined();
      expect(result.system.nodeVersion).toBeDefined();
      expect(result.system.cpu).toBeDefined();
      expect(result.system.memory).toBeDefined();

      // Check runtime information
      expect(result.runtime).toBeDefined();
      expect(typeof result.runtime.isBun).toBe("boolean");
      expect(typeof result.runtime.isNode).toBe("boolean");
      expect(result.runtime.nodeVersion).toBeDefined();
      expect(result.runtime.processId).toBeDefined();

      // Check environment variables
      expect(result.environment).toBeDefined();
    });

    test("should handle missing .chara.json file", async () => {
      const result = await fileSystem.execute({
        action: "env",
        workingDir: testDir,
        includeSystem: false,
        includeProject: true,
      });

      expect(result.project).toBeDefined();
      expect(result.project.hasCharaConfig).toBe(false);
      expect(result.project.message).toContain(".chara.json file not found");
      expect(result.system).toBeUndefined();
    });

    test("should handle invalid .chara.json file", async () => {
      // Create invalid JSON file
      writeFileSync(charaConfigPath, "invalid json content");

      const result = await fileSystem.execute({
        action: "env",
        workingDir: testDir,
        includeProject: true,
        includeSystem: false,
      });

      expect(result.project).toBeDefined();
      expect(result.project.hasCharaConfig).toBe(false);
      expect(result.project.error).toContain("Failed to read .chara.json");
    });

    test("should work with includeSystem=false", async () => {
      const result = await fileSystem.execute({
        action: "env",
        workingDir: testDir,
        includeSystem: false,
        includeProject: true,
      });

      expect(result.system).toBeUndefined();
      expect(result.runtime).toBeUndefined();
      expect(result.environment).toBeUndefined();
      expect(result.project).toBeDefined();
    });

    test("should work with includeProject=false", async () => {
      const result = await fileSystem.execute({
        action: "env",
        workingDir: testDir,
        includeProject: false,
        includeSystem: true,
      });

      expect(result.project).toBeUndefined();
      expect(result.system).toBeDefined();
      expect(result.runtime).toBeDefined();
      expect(result.environment).toBeDefined();
    });

    test("should use current directory as default", async () => {
      const result = await fileSystem.execute({
        action: "env",
      });

      expect(result.workingDirectory).toBe(process.cwd());
    });
  });

  describe("error handling", () => {
    test("should throw error for unknown action", async () => {
      await expect(
        fileSystem.execute({
          action: "invalid" as any,
          path: testFS.getPath(),
        })
      ).rejects.toThrow("Unknown action: invalid");
    });

    test("should handle non-existent directories gracefully", async () => {
      const nonExistentPath = testFS.getPath("does-not-exist");

      await expect(
        fileSystem.execute({
          action: "list",
          path: nonExistentPath,
        })
      ).rejects.toThrow("File system operation 'list' failed");
    });

    test("should handle permission errors gracefully", async () => {
      // Try to list a restricted directory
      const restrictedPath = "/root";

      await expect(
        fileSystem.execute({
          action: "list",
          path: restrictedPath,
        })
      ).rejects.toThrow("File system operation 'list' failed");
    });
  });

  describe("special cases", () => {
    test("should handle unicode filenames", async () => {
      await testFS.createFile("测试.txt", "test content");
      await testFS.createFile("🚀rocket.txt", "rocket content");
      await mkdir(testFS.getPath("café"));

      const result = await fileSystem.execute({
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

      const result = await fileSystem.execute({
        action: "list",
        path: testFS.getPath(),
      });

      expect(result.formatted).toContain(longName);
    });

    test("should handle concurrent operations", async () => {
      await testFS.createFile("concurrent1.txt", "content1");
      await testFS.createFile("concurrent2.txt", "content2");

      const [result1, result2] = await Promise.all([
        fileSystem.execute({ action: "list", path: testFS.getPath() }),
        fileSystem.execute({ action: "stats", path: testFS.getPath() }),
      ]);

      expect(result1.operation).toBe("list");
      expect(result2.operation).toBe("stats");
      expect(result1.count).toBe(2);
      expect(result2.stats.totalFiles).toBe(2);
    });
  });

  describe("tool metadata", () => {
    test("should have correct tool description", () => {
      expect(fileSystem.description).toContain(
        "Comprehensive file system management tool"
      );
      expect(fileSystem.description).toContain("list");
      expect(fileSystem.description).toContain("tree");

      expect(fileSystem.description).toContain("current");
      expect(fileSystem.description).toContain("stats");
      expect(fileSystem.description).toContain("find");
      expect(fileSystem.description).toContain("info");
      expect(fileSystem.description).toContain("env");
    });

    test("should have proper parameter validation", () => {
      expect(fileSystem.parameters).toBeDefined();
    });
  });
});
