import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdir } from "../mkdir";
import { stat, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { existsSync } from "node:fs";

class TestFileSystem {
  private testDir: string;

  constructor() {
    this.testDir = join(
      tmpdir(),
      `mkdir-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );
  }

  async setup() {
    await mkdir.execute({
      path: this.testDir,
      type: "directory",
    });
  }

  async cleanup() {
    if (existsSync(this.testDir)) {
      await rm(this.testDir, { recursive: true, force: true });
    }
  }

  getPath(relativePath: string = ""): string {
    return relativePath ? join(this.testDir, relativePath) : this.testDir;
  }

  async fileExists(relativePath: string): Promise<boolean> {
    try {
      await stat(this.getPath(relativePath));
      return true;
    } catch {
      return false;
    }
  }

  async isDirectory(relativePath: string): Promise<boolean> {
    try {
      const stats = await stat(this.getPath(relativePath));
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  async isFile(relativePath: string): Promise<boolean> {
    try {
      const stats = await stat(this.getPath(relativePath));
      return stats.isFile();
    } catch {
      return false;
    }
  }
}

describe("mkdir tool", () => {
  let testFS: TestFileSystem;

  beforeEach(async () => {
    testFS = new TestFileSystem();
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  describe("directory creation", () => {
    test("should create directory successfully with relative path", async () => {
      // Save current working directory
      const originalCwd = process.cwd();

      try {
        // Change to test directory
        process.chdir(testFS.getPath());

        const result = await mkdir.execute({
          path: "new-directory",
        });

        expect(result.success).toBe(true);
        expect(result.operation).toBe("mkdir");
        expect(result.path).toBe("new-directory");
        expect(result.message).toContain("Successfully created directory");
        expect(await testFS.fileExists("new-directory")).toBe(true);
        expect(await testFS.isDirectory("new-directory")).toBe(true);
      } finally {
        // Restore original working directory
        process.chdir(originalCwd);
      }
    });

    test("should create nested directories with recursive option", async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(testFS.getPath());

        const result = await mkdir.execute({
          path: "level1/level2/level3",
          recursive: true,
        });

        expect(result.success).toBe(true);
        expect(result.recursive).toBe(true);
        expect(await testFS.fileExists("level1")).toBe(true);
        expect(await testFS.fileExists("level1/level2")).toBe(true);
        expect(await testFS.fileExists("level1/level2/level3")).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });

    test("should handle absolute paths", async () => {
      const dirPath = testFS.getPath("absolute-test");

      const result = await mkdir.execute({
        path: dirPath,
      });

      expect(result.success).toBe(true);
      expect(result.path).toBe(dirPath);
      expect(await testFS.isDirectory("absolute-test")).toBe(true);
    });

    test("should treat path with trailing slash correctly", async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(testFS.getPath());

        const result = await mkdir.execute({
          path: "trailing-slash-dir/",
        });

        expect(result.success).toBe(true);
        expect(result.path).toBe("trailing-slash-dir");
        expect(await testFS.isDirectory("trailing-slash-dir")).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe("edge cases and error handling", () => {
    test("should handle empty path", async () => {
      const result = await mkdir.execute({
        path: "",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.message).toContain("Path cannot be empty");
    });

    test("should handle whitespace-only path", async () => {
      const result = await mkdir.execute({
        path: "   ",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.message).toContain("Path cannot be empty");
    });

    test("should handle existing directory gracefully with recursive mode", async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(testFS.getPath());

        // Create directory first
        const firstResult = await mkdir.execute({
          path: "existing-dir",
        });
        expect(firstResult.success).toBe(true);

        // Try to create again - mkdir with recursive: true succeeds for existing directories
        const result = await mkdir.execute({
          path: "existing-dir",
        });

        expect(result.success).toBe(true);
        expect(result.message).toContain("Successfully created directory");
      } finally {
        process.chdir(originalCwd);
      }
    });

    test("should handle recursive=false for nested paths", async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(testFS.getPath());

        const result = await mkdir.execute({
          path: "non-existent/nested/dir",
          recursive: false,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe(true);
        expect(result.message).toContain("Failed to create directory");
        expect(result.suggestion).toContain("recursive mode");
      } finally {
        process.chdir(originalCwd);
      }
    });

    test("should provide helpful error suggestions", async () => {
      const result = await mkdir.execute({
        path: "/root/no-permission-dir",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.suggestion).toBeDefined();
      expect(typeof result.suggestion).toBe("string");
    });
  });

  describe("relative path handling", () => {
    test("should create directories with various relative paths", async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(testFS.getPath());

        const testCases = [
          "simple-dir",
          "my-folder",
          "components",
          "utils",
          "src",
          "nested/deep/dir",
          "./relative-dir",
          "dir-with-dots.and.stuff",
        ];

        for (const dirName of testCases) {
          const result = await mkdir.execute({
            path: dirName,
          });

          expect(result.success).toBe(true);
          expect(result.operation).toBe("mkdir");

          // Check that directory was created
          const cleanPath = dirName.replace(/^\.\//, "");
          expect(await testFS.fileExists(cleanPath)).toBe(true);
          expect(await testFS.isDirectory(cleanPath)).toBe(true);
        }
      } finally {
        process.chdir(originalCwd);
      }
    });

    test("should handle parent directory references", async () => {
      const originalCwd = process.cwd();

      try {
        // Create a subdirectory to work from
        process.chdir(testFS.getPath());
        await mkdir.execute({ path: "subdir" });

        // Change to subdirectory
        process.chdir(testFS.getPath("subdir"));

        // Create directory in parent using ../
        const result = await mkdir.execute({
          path: "../parent-ref-dir",
        });

        expect(result.success).toBe(true);

        // Verify directory was created in parent
        expect(await testFS.fileExists("parent-ref-dir")).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe("tool metadata", () => {
    test("should have correct tool description", () => {
      expect(mkdir.description).toContain("Create directories");
      expect(mkdir.description).toContain("recursive parent creation");
      expect(mkdir.description).toContain("equivalent to 'mkdir -p'");
      expect(mkdir.description).toContain("relative paths");
    });

    test("should have proper parameter validation", () => {
      expect(mkdir.parameters).toBeDefined();
    });

    test("should have required path parameter", () => {
      const pathParam = mkdir.parameters.shape.path;
      expect(pathParam).toBeDefined();
      expect(pathParam._def.typeName).toBe("ZodString");
    });

    test("should have recursive parameter with default true", () => {
      const recursiveParam = mkdir.parameters.shape.recursive;
      expect(recursiveParam._def.defaultValue()).toBe(true);
    });

    test("should not have file-related parameters", () => {
      expect(mkdir.parameters.shape.type).toBeUndefined();
      expect(mkdir.parameters.shape.content).toBeUndefined();
    });
  });

  describe("unicode and special characters", () => {
    test("should handle unicode directory names", async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(testFS.getPath());

        const result = await mkdir.execute({
          path: "测试目录",
        });

        expect(result.success).toBe(true);
        expect(await testFS.fileExists("测试目录")).toBe(true);
        expect(await testFS.isDirectory("测试目录")).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });

    test("should handle special characters in directory names", async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(testFS.getPath());

        const result = await mkdir.execute({
          path: "dir with spaces & symbols!",
        });

        expect(result.success).toBe(true);
        expect(await testFS.fileExists("dir with spaces & symbols!")).toBe(
          true
        );
      } finally {
        process.chdir(originalCwd);
      }
    });

    test("should handle very long directory names", async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(testFS.getPath());
        const longName = "a".repeat(100);

        const result = await mkdir.execute({
          path: longName,
        });

        expect(result.success).toBe(true);
        expect(await testFS.fileExists(longName)).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe("concurrent operations", () => {
    test("should handle concurrent directory creation", async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(testFS.getPath());

        const paths = Array.from(
          { length: 5 },
          (_, i) => `concurrent-dir-${i}`
        );

        const promises = paths.map((path) =>
          mkdir.execute({
            path,
          })
        );

        const results = await Promise.all(promises);

        results.forEach((result, i) => {
          expect(result.success).toBe(true);
          expect(result.operation).toBe("mkdir");
        });

        // Verify all directories were created
        for (let i = 0; i < 5; i++) {
          expect(await testFS.isDirectory(`concurrent-dir-${i}`)).toBe(true);
        }
      } finally {
        process.chdir(originalCwd);
      }
    });

    test("should handle concurrent nested directory creation", async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(testFS.getPath());

        const paths = [
          "deep/nested/dir1",
          "deep/nested/dir2",
          "deep/nested/dir3",
        ];

        const promises = paths.map((path) =>
          mkdir.execute({
            path,
          })
        );

        const results = await Promise.all(promises);

        results.forEach((result) => {
          expect(result.success).toBe(true);
          expect(result.operation).toBe("mkdir");
        });

        // Verify all directories were created
        for (const path of paths) {
          expect(await testFS.fileExists(path)).toBe(true);
          expect(await testFS.isDirectory(path)).toBe(true);
        }
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});
