import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { fileSystem } from "../file-system";
import { createTestFS } from "./test-utils";
import { mkdir } from "node:fs/promises";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";

// Helper function to check if result is an error object
function isErrorResult(
  result: any
): result is { error: true; message: string; suggestion: string } {
  return result && result.error === true;
}

describe("fileSystem tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
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

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        expect(result.operation).toBe("stats");
        expect(result.stats.totalFiles).toBe(3);
        expect(result.stats.totalDirectories).toBe(2);
        expect(result.stats.totalSize).toBeGreaterThan(0);
        expect(result.formatted).toContain("Files: 3");
        expect(result.formatted).toContain("Directories: 2");
      }
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

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        expect(result.stats.totalFiles).toBe(1); // Only visible.txt
        expect(result.stats.hiddenItems).toBe(2); // .hidden.txt and .hidden-dir
        expect(result.formatted).toContain("2 (excluded)");
      }
    });

    test("should include hidden items when requested", async () => {
      await testFS.createFile("visible.txt", "content");
      await testFS.createFile(".hidden.txt", "hidden");

      const result = await fileSystem.execute({
        action: "stats",
        path: testFS.getPath(),
        includeHidden: true,
      });

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        expect(result.stats.totalFiles).toBe(2); // Both files counted
        expect(result.formatted).toContain("(included)");
      }
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

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
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
      }
    });

    test("should get directory info successfully", async () => {
      const dirPath = testFS.getPath("test-dir");
      await mkdir(dirPath);

      const result = await fileSystem.execute({
        action: "info",
        path: dirPath,
      });

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        expect(result.operation).toBe("info");
        expect(result.path).toBe(dirPath);
        expect(result.isFile).toBe(false);
        expect(result.isDirectory).toBe(true);
        expect(result.created).toBeInstanceOf(Date);
        expect(result.modified).toBeInstanceOf(Date);
        expect(result.accessed).toBeInstanceOf(Date);
        expect(result.formattedInfo).toContain("isDirectory: true");
      }
    });

    test("should handle empty file", async () => {
      const filePath = await testFS.createFile("empty.txt", "");

      const result = await fileSystem.execute({
        action: "info",
        path: filePath,
      });

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        expect(result.size).toBe(0);
        expect(result.isFile).toBe(true);
        expect(result.isDirectory).toBe(false);
      }
    });

    test("should return error object when path is not provided", async () => {
      const result = await fileSystem.execute({
        action: "info",
      });

      expect(isErrorResult(result)).toBe(true);
      if (isErrorResult(result)) {
        expect(result.error).toBe(true);
        expect(result.message).toContain("Path is required for info operation");
        expect(result.suggestion).toContain(
          '"info" action requires a "path" parameter'
        );
      }
    });

    test("should return error object for non-existent file", async () => {
      const nonExistentPath = testFS.getPath("does-not-exist.txt");

      const result = await fileSystem.execute({
        action: "info",
        path: nonExistentPath,
      });

      expect(isErrorResult(result)).toBe(true);
      if (isErrorResult(result)) {
        expect(result.error).toBe(true);
        expect(result.message).toContain("Failed to get file info");
        expect(result.suggestion).toContain("Check if the file exists");
      }
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

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        // Check basic structure
        expect(result.operation).toBe("env");
        expect(result.workingDirectory).toBe(testDir);
        expect(result.timestamp).toBeDefined();

        // Check project information
        expect(result.project).toBeDefined();
        expect(result.project!.hasCharaConfig).toBe(true);
        expect(result.project!.dev).toBe("npm run dev");
        expect(result.project!.info).toEqual(testConfig.info);
        expect(result.project!.files).toBeDefined();

        // Check system information
        expect(result.system).toBeDefined();
        expect(result.system!.platform).toBeDefined();
        expect(result.system!.architecture).toBeDefined();
        expect(result.system!.nodeVersion).toBeDefined();
        expect(result.system!.cpu).toBeDefined();
        expect(result.system!.memory).toBeDefined();

        // Check runtime information
        expect(result.runtime).toBeDefined();
        expect(typeof result.runtime!.isBun).toBe("boolean");
        expect(typeof result.runtime!.isNode).toBe("boolean");
        expect(result.runtime!.nodeVersion).toBeDefined();
        expect(result.runtime!.processId).toBeDefined();

        // Check environment variables
        expect(result.environment).toBeDefined();
      }
    });

    test("should handle missing .chara.json file", async () => {
      const result = await fileSystem.execute({
        action: "env",
        workingDir: testDir,
        includeSystem: false,
        includeProject: true,
      });

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        expect(result.project).toBeDefined();
        expect(result.project!.hasCharaConfig).toBe(false);
        expect(result.project!.message).toContain(".chara.json file not found");
        expect(result.system).toBeUndefined();
      }
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

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        expect(result.project).toBeDefined();
        expect(result.project!.hasCharaConfig).toBe(false);
        expect(result.project!.error).toContain("Failed to read .chara.json");
      }
    });

    test("should work with includeSystem=false", async () => {
      const result = await fileSystem.execute({
        action: "env",
        workingDir: testDir,
        includeSystem: false,
        includeProject: true,
      });

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        expect(result.system).toBeUndefined();
        expect(result.runtime).toBeUndefined();
        expect(result.environment).toBeUndefined();
        expect(result.project).toBeDefined();
      }
    });

    test("should work with includeProject=false", async () => {
      const result = await fileSystem.execute({
        action: "env",
        workingDir: testDir,
        includeProject: false,
        includeSystem: true,
      });

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        expect(result.project).toBeUndefined();
        expect(result.system).toBeDefined();
        expect(result.runtime).toBeDefined();
        expect(result.environment).toBeDefined();
      }
    });

    test("should use current directory as default", async () => {
      const result = await fileSystem.execute({
        action: "env",
      });

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        expect(result.workingDirectory).toBe(process.cwd());
      }
    });

    test("should return error object for invalid .chara.json", async () => {
      // Create invalid JSON file
      writeFileSync(charaConfigPath, "invalid json content");

      const result = await fileSystem.execute({
        action: "env",
        workingDir: testDir,
        includeProject: true,
        includeSystem: false,
      });

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        // Should still succeed but with project error details
        expect(result.operation).toBe("env");
        expect(result.project).toBeDefined();
        expect(result.project!.hasCharaConfig).toBe(false);
        expect(result.project!.error).toContain("Failed to read .chara.json");
      }
    });

    test("should handle directory read errors", async () => {
      const invalidDir = "/invalid/nonexistent/directory/path";

      const result = await fileSystem.execute({
        action: "env",
        workingDir: invalidDir,
        includeProject: true,
        includeSystem: false,
      });

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        // Should succeed with the working directory set, even if invalid
        expect(result.operation).toBe("env");
        expect(result.workingDirectory).toBe(invalidDir);
      }
    });
  });

  describe("error handling", () => {
    test("should return error object for unknown action", async () => {
      const result = await fileSystem.execute({
        action: "invalid" as any,
        path: testFS.getPath(),
      });

      expect(isErrorResult(result)).toBe(true);
      if (isErrorResult(result)) {
        expect(result.error).toBe(true);
        expect(result.suggestion).toContain("Did you mean");
      }
    });

    test("should handle non-existent directories gracefully", async () => {
      const nonExistentPath = testFS.getPath("does-not-exist");

      const result = await fileSystem.execute({
        action: "stats",
        path: nonExistentPath,
      });

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        expect(result.operation).toBe("stats");
        expect(result.stats.totalFiles).toBe(0);
        expect(result.stats.totalDirectories).toBe(0);
      }
    });

    test("should handle permission errors gracefully", async () => {
      // Try to get stats on a restricted directory
      const restrictedPath = "/root";

      const result = await fileSystem.execute({
        action: "stats",
        path: restrictedPath,
      });

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        expect(result.operation).toBe("stats");
        // Should handle gracefully with zero or minimal stats
        expect(typeof result.stats.totalFiles).toBe("number");
      }
    });

    test("should return error object for invalid directory", async () => {
      const nonExistentPath = testFS.getPath("does-not-exist");

      const result = await fileSystem.execute({
        action: "stats",
        path: nonExistentPath,
      });

      // Should either succeed with empty stats or return error object
      if (isErrorResult(result)) {
        expect(result.error).toBe(true);
        expect(result.message).toContain(
          "Failed to collect directory statistics"
        );
      } else {
        expect(result.operation).toBe("stats");
        expect(typeof result.stats.totalFiles).toBe("number");
      }
    });

    test("should handle maxDepth overflow protection", async () => {
      const result = await fileSystem.execute({
        action: "stats",
        path: testFS.getPath(),
        maxDepth: 15,
      });

      expect(isErrorResult(result)).toBe(true);
      if (isErrorResult(result)) {
        expect(result.error).toBe(true);
        expect(result.message).toContain("maxDepth too large");
        expect(result.suggestion).toContain("Please use a value between 1-10");
      }
    });
  });

  describe("special cases", () => {
    test("should handle unicode filenames", async () => {
      await testFS.createFile("测试.txt", "test content");
      await testFS.createFile("🚀rocket.txt", "rocket content");
      await mkdir(testFS.getPath("café"));

      const result = await fileSystem.execute({
        action: "stats",
        path: testFS.getPath(),
      });

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        expect(result.stats.totalFiles).toBe(2);
        expect(result.stats.totalDirectories).toBe(1);
      }
    });

    test("should handle very long filenames", async () => {
      const longName = "a".repeat(200) + ".txt";
      await testFS.createFile(longName, "long filename content");

      const result = await fileSystem.execute({
        action: "stats",
        path: testFS.getPath(),
      });

      expect(isErrorResult(result)).toBe(false);
      if (!isErrorResult(result)) {
        expect(result.stats.totalFiles).toBe(1);
      }
    });

    test("should handle concurrent operations", async () => {
      await testFS.createFile("concurrent1.txt", "content1");
      await testFS.createFile("concurrent2.txt", "content2");

      const [result1, result2] = await Promise.all([
        fileSystem.execute({
          action: "stats",
          path: testFS.getPath(),
        }),
        fileSystem.execute({
          action: "stats",
          path: testFS.getPath(),
        }),
      ]);

      expect(isErrorResult(result1)).toBe(false);
      expect(isErrorResult(result2)).toBe(false);
      if (!isErrorResult(result1) && !isErrorResult(result2)) {
        expect(result1.operation).toBe("stats");
        expect(result2.operation).toBe("stats");
        expect(result1.stats.totalFiles).toBe(2);
        expect(result2.stats.totalFiles).toBe(2);
      }
    });
  });

  describe("LLM agent error handling", () => {
    test("should return structured error objects for all operation types", async () => {
      // Test invalid action
      const invalidActionResult = await fileSystem.execute({
        action: "grep" as any,
      });

      expect(isErrorResult(invalidActionResult)).toBe(true);
      if (isErrorResult(invalidActionResult)) {
        expect(invalidActionResult.error).toBe(true);
        expect(invalidActionResult.suggestion).toContain("Did you mean");
      }

      // Test info without path
      const infoResult = await fileSystem.execute({
        action: "info",
      });

      expect(isErrorResult(infoResult)).toBe(true);
      if (isErrorResult(infoResult)) {
        expect(infoResult.error).toBe(true);
        expect(infoResult.message).toContain("Path is required");
      }

      // Test info with invalid path
      const invalidPathResult = await fileSystem.execute({
        action: "info",
        path: "/nonexistent/file.txt",
      });

      expect(isErrorResult(invalidPathResult)).toBe(true);
      if (isErrorResult(invalidPathResult)) {
        expect(invalidPathResult.error).toBe(true);
        expect(invalidPathResult.suggestion).toContain(
          "Check if the file exists"
        );
      }
    });

    test("should provide helpful suggestions for common LLM mistakes", async () => {
      const testCases = [
        { action: "search", expectedSuggestion: "stats" },
        { action: "locate", expectedSuggestion: "info" },
        { action: "environment", expectedSuggestion: "env" },
        { action: "details", expectedSuggestion: "info" },
      ];

      for (const testCase of testCases) {
        const result = await fileSystem.execute({
          action: testCase.action as any,
        });

        expect(isErrorResult(result)).toBe(true);
        if (isErrorResult(result)) {
          expect(result.error).toBe(true);
          expect(result.suggestion).toContain(testCase.expectedSuggestion);
        }
      }
    });

    test("should handle system resource protection with error objects", async () => {
      const result = await fileSystem.execute({
        action: "stats",
        path: testFS.getPath(),
        maxDepth: 20,
      });

      expect(isErrorResult(result)).toBe(true);
      if (isErrorResult(result)) {
        expect(result.error).toBe(true);
        expect(result.message).toContain("maxDepth too large");
      }
    });

    test("should maintain consistent error object structure", async () => {
      const errorResults = await Promise.all([
        fileSystem.execute({
          action: "invalid" as any,
        }),
        fileSystem.execute({
          action: "info",
        }),
        fileSystem.execute({
          action: "info",
          path: "/nonexistent",
        }),
      ]);

      errorResults.forEach((result) => {
        expect(isErrorResult(result)).toBe(true);
        if (isErrorResult(result)) {
          expect(result.error).toBe(true);
          expect(typeof result.message).toBe("string");
          expect(typeof result.suggestion).toBe("string");
          expect(result.message.length).toBeGreaterThan(0);
          expect(result.suggestion.length).toBeGreaterThan(0);
        }
      });
    });

    test("should always return error objects instead of throwing", async () => {
      // These should all return error objects instead of throwing
      const operations = [
        { action: "invalid" as any },
        { action: "info" },
        { action: "info", path: "/nonexistent" },
        { action: "stats", maxDepth: 15 },
      ];

      for (const operation of operations) {
        const result = await fileSystem.execute({
          ...operation,
        });

        expect(result).toBeDefined();
        expect(isErrorResult(result)).toBe(true);
      }
    });
  });

  describe("tool metadata", () => {
    test("should have correct tool description", () => {
      expect(fileSystem.description).toContain(
        "Comprehensive file system management tool"
      );
      expect(fileSystem.description).toContain("stats");
      expect(fileSystem.description).toContain("info");
      expect(fileSystem.description).toContain("env");
    });

    test("should have proper parameter validation", () => {
      expect(fileSystem.parameters).toBeDefined();
    });
  });
});
