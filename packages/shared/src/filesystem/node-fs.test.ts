import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { NodeFS } from "./node-fs.js";

describe("NodeFS", () => {
  let nodeFS: NodeFS;
  let testDir: string;

  beforeEach(async () => {
    nodeFS = new NodeFS();
    testDir = join(
      tmpdir(),
      `node-fs-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("path operations", () => {
    test("should handle absolute paths correctly", () => {
      expect(nodeFS.isAbsolute("/absolute/path")).toBe(true);
      expect(nodeFS.isAbsolute("relative/path")).toBe(false);
      expect(nodeFS.isAbsolute("./relative/path")).toBe(false);
    });

    test("should resolve paths correctly", () => {
      const result = nodeFS.resolve("test", "file.txt");
      expect(result).toBe(resolve("test", "file.txt"));
    });

    test("should get dirname correctly", () => {
      expect(nodeFS.dirname("/path/to/file.txt")).toBe("/path/to");
    });

    test("should get basename correctly", () => {
      expect(nodeFS.basename("/path/to/file.txt")).toBe("file.txt");
    });

    test("should join paths correctly", () => {
      expect(nodeFS.join("path", "to", "file.txt")).toBe(
        join("path", "to", "file.txt")
      );
    });

    test("should get relative paths correctly", () => {
      const result = nodeFS.relative("/path/from", "/path/to");
      expect(result).toBe("../to");
    });
  });

  describe("environment", () => {
    test("should return node environment", () => {
      expect(nodeFS.getEnvironment()).toBe("node");
    });

    test("should have correct working directory", () => {
      expect(nodeFS.cwd).toBe(process.cwd());
    });
  });

  describe("file operations", () => {
    test("should check if file exists", async () => {
      const testFile = join(testDir, "test-file.txt");

      // File doesn't exist yet
      expect(await nodeFS.fileExists(testFile)).toBe(false);

      // Create file
      await fs.writeFile(testFile, "test content");

      // File exists now
      expect(await nodeFS.fileExists(testFile)).toBe(true);
    });

    test("should read and write files", async () => {
      const testFile = join(testDir, "test-file.txt");
      const content = "Hello, World!";

      // Write file
      await nodeFS.writeFile(testFile, content);

      // Read file
      const readContent = await nodeFS.readFile(testFile);
      expect(readContent).toBe(content);
    });

    test("should get file stats", async () => {
      const testFile = join(testDir, "test-file.txt");
      await fs.writeFile(testFile, "test content");

      const stats = await nodeFS.stat(testFile);
      expect(stats.isFile()).toBe(true);
      expect(stats.isDirectory()).toBe(false);
    });
  });

  describe("directory operations", () => {
    test("should read directory as string array", async () => {
      // Create test files
      await fs.writeFile(join(testDir, "file1.txt"), "content1");
      await fs.writeFile(join(testDir, "file2.txt"), "content2");
      await fs.mkdir(join(testDir, "subdir"));

      const entries = await nodeFS.readDir(testDir);
      expect(Array.isArray(entries)).toBe(true);
      expect(entries).toContain("file1.txt");
      expect(entries).toContain("file2.txt");
      expect(entries).toContain("subdir");
    });

    test("should read directory with file types", async () => {
      // Create test files and directories
      await fs.writeFile(join(testDir, "file1.txt"), "content1");
      await fs.writeFile(join(testDir, "file2.txt"), "content2");
      await fs.mkdir(join(testDir, "subdir"));

      const entries = await nodeFS.readDir(testDir, true);
      expect(typeof entries === "object" && !Array.isArray(entries)).toBe(true);

      const typedEntries = entries as Record<string, "directory" | "file">;
      expect(typedEntries["file1.txt"]).toBe("file");
      expect(typedEntries["file2.txt"]).toBe("file");
      expect(typedEntries["subdir"]).toBe("directory");
    });

    test("should handle readdir for simple listing", async () => {
      await fs.writeFile(join(testDir, "test.txt"), "content");

      const entries = await nodeFS.readdir(testDir);
      expect(entries).toContain("test.txt");
    });

    test("should return empty array for non-existent directory", async () => {
      const nonExistentDir = join(testDir, "non-existent");

      const entries = await nodeFS.readDir(nonExistentDir);
      expect(entries).toEqual([]);
    });

    test("should return empty array for non-existent directory with file types", async () => {
      const nonExistentDir = join(testDir, "non-existent");

      const entries = await nodeFS.readDir(nonExistentDir, true);
      expect(entries).toEqual({});
    });
  });

  describe("error handling", () => {
    test("should handle file not found for readFile", async () => {
      const nonExistentFile = join(testDir, "non-existent.txt");

      await expect(nodeFS.readFile(nonExistentFile)).rejects.toThrow();
    });

    test("should handle file not found for stat", async () => {
      const nonExistentFile = join(testDir, "non-existent.txt");

      await expect(nodeFS.stat(nonExistentFile)).rejects.toThrow();
    });

    test("should handle permission errors gracefully for fileExists", async () => {
      // This test assumes the file doesn't exist, which should return false
      const result = await nodeFS.fileExists("/root/restricted-file.txt");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("path resolution", () => {
    test("should resolve relative paths correctly", async () => {
      const testFile = join(testDir, "nested", "file.txt");
      await fs.mkdir(join(testDir, "nested"), { recursive: true });
      await fs.writeFile(testFile, "content");

      // Change to test directory temporarily
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        const exists = await nodeFS.fileExists("nested/file.txt");
        expect(exists).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });

    test("should handle absolute paths correctly", async () => {
      const testFile = join(testDir, "absolute-test.txt");
      await fs.writeFile(testFile, "content");

      const exists = await nodeFS.fileExists(testFile);
      expect(exists).toBe(true);
    });
  });

  describe("integration with real filesystem", () => {
    test("should work with actual package.json files", async () => {
      const packageJson = {
        name: "test-package",
        version: "1.0.0",
        scripts: {
          dev: "npm run dev",
          build: "npm run build",
        },
      };

      const packagePath = join(testDir, "package.json");
      await nodeFS.writeFile(packagePath, JSON.stringify(packageJson, null, 2));

      const content = await nodeFS.readFile(packagePath);
      const parsed = JSON.parse(content);

      expect(parsed.name).toBe("test-package");
      expect(parsed.scripts.dev).toBe("npm run dev");
    });

    test("should handle complex directory structures", async () => {
      // Create complex structure
      await fs.mkdir(join(testDir, "src", "components"), { recursive: true });
      await fs.mkdir(join(testDir, "src", "utils"), { recursive: true });
      await fs.mkdir(join(testDir, "dist"), { recursive: true });

      await fs.writeFile(
        join(testDir, "src", "index.ts"),
        "export * from './components';"
      );
      await fs.writeFile(
        join(testDir, "src", "components", "Button.tsx"),
        "export const Button = () => {};"
      );
      await fs.writeFile(
        join(testDir, "src", "utils", "helpers.ts"),
        "export const helper = () => {};"
      );

      const srcEntries = await nodeFS.readDir(join(testDir, "src"), true);
      expect(srcEntries).toEqual({
        "index.ts": "file",
        components: "directory",
        utils: "directory",
      });

      const componentEntries = await nodeFS.readDir(
        join(testDir, "src", "components")
      );
      expect(componentEntries).toContain("Button.tsx");
    });
  });
});
