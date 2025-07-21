import { beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { find } from "../find";

// Type guard to check if result is an error
function isErrorResult(
  result: unknown
): result is { error: true; message: string } {
  return (result as any).error === true;
}

// Type guard to check if result is successful
function isSuccessResult(result: unknown): result is {
  operation: string;
  count: number;
  results: Array<{
    path: string;
    type: string;
    relativePath: string;
    absolutePath: string;
  }>;
  formatted: string;
  [key: string]: unknown;
} {
  return (result as any).error !== true && (result as any).operation === "find";
}

describe("find tool", () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary directory for each test
    testDir = await mkdtemp(join(tmpdir(), "find-test-"));

    // Create test files and directories
    await writeFile(join(testDir, "test.js"), "console.log('test');");
    await writeFile(join(testDir, "test.ts"), "console.log('test');");
    await writeFile(join(testDir, "README.md"), "# Test");
    await writeFile(join(testDir, ".hidden"), "hidden content");
    await writeFile(join(testDir, "package.json"), '{"name": "test"}');

    // Create .gitignore
    await writeFile(join(testDir, ".gitignore"), "*.log\nbuild/\n");

    // Create nested structure
    const nestedDir = join(testDir, "src");
    await mkdir(nestedDir, { recursive: true });
    await writeFile(join(nestedDir, "index.js"), "// main file");
    await writeFile(join(nestedDir, "utils.ts"), "// utils");

    const buildDir = join(testDir, "build");
    await mkdir(buildDir, { recursive: true });
    await writeFile(join(buildDir, "output.js"), "// build output");
  });

  describe("successful operations", () => {
    test("should find all files with default pattern", async () => {
      const result = await find.execute({
        path: testDir,
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        expect(result.operation).toBe("find");
        expect(result.count).toBeGreaterThan(0);
        expect(result.results).toBeDefined();
        expect(Array.isArray(result.results)).toBe(true);
      }
    });

    test("should find JavaScript files", async () => {
      const result = await find.execute({
        path: testDir,
        pattern: "**/*.js",
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        expect(result.count).toBeGreaterThan(0);
        const jsFiles = result.results.filter((r) => r.path.endsWith(".js"));
        expect(jsFiles.length).toBeGreaterThan(0);
      }
    });

    test("should find TypeScript files", async () => {
      const result = await find.execute({
        path: testDir,
        pattern: "**/*.ts",
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        const tsFiles = result.results.filter((r) => r.path.endsWith(".ts"));
        expect(tsFiles.length).toBeGreaterThan(0);
      }
    });

    test("should find files with pipe-separated patterns", async () => {
      const result = await find.execute({
        path: testDir,
        pattern: "*.js|*.ts",
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        const scriptFiles = result.results.filter(
          (r) => r.path.endsWith(".js") || r.path.endsWith(".ts")
        );
        expect(scriptFiles.length).toBeGreaterThan(0);
      }
    });

    test("should include hidden files when requested", async () => {
      const result = await find.execute({
        path: testDir,
        pattern: "**/*",
        includeHidden: true,
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        const hiddenFiles = result.results.filter((r) =>
          r.path.includes(".hidden")
        );
        expect(hiddenFiles.length).toBeGreaterThan(0);
      }
    });

    test("should exclude hidden files by default", async () => {
      const result = await find.execute({
        path: testDir,
        pattern: "**/*",
        includeHidden: false,
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        const hiddenFiles = result.results.filter((r) =>
          r.path.includes(".hidden")
        );
        expect(hiddenFiles.length).toBe(0);
      }
    });

    test("should respect gitignore files", async () => {
      // Create a .log file that should be ignored
      await writeFile(join(testDir, "debug.log"), "log content");

      const result = await find.execute({
        path: testDir,
        pattern: "**/*",
        respectGitignore: true,
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        const logFiles = result.results.filter((r) => r.path.endsWith(".log"));
        expect(logFiles.length).toBe(0);
      }
    });

    test("should ignore gitignore when disabled", async () => {
      // Create a .log file that would normally be ignored
      await writeFile(join(testDir, "debug.log"), "log content");

      const result = await find.execute({
        path: testDir,
        pattern: "**/*.log",
        respectGitignore: false,
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        const logFiles = result.results.filter((r) => r.path.endsWith(".log"));
        expect(logFiles.length).toBeGreaterThan(0);
      }
    });

    test("should exclude patterns correctly", async () => {
      const result = await find.execute({
        path: testDir,
        pattern: "**/*",
        excludePatterns: ["*.md"],
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        const mdFiles = result.results.filter((r) => r.path.endsWith(".md"));
        expect(mdFiles.length).toBe(0);
      }
    });

    test("should return structured result object", async () => {
      const result = await find.execute({
        path: testDir,
        pattern: "*.js",
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        expect(result).toHaveProperty("operation", "find");
        expect(result).toHaveProperty("searchPath");
        expect(result).toHaveProperty("pattern");
        expect(result).toHaveProperty("originalPattern");
        expect(result).toHaveProperty("preprocessedPatterns");
        expect(result).toHaveProperty("excludePatterns");
        expect(result).toHaveProperty("includeHidden");
        expect(result).toHaveProperty("respectGitignore");
        expect(result).toHaveProperty("count");
        expect(result).toHaveProperty("totalFound");
        expect(result).toHaveProperty("results");
        expect(result).toHaveProperty("formatted");

        expect(Array.isArray(result.results)).toBe(true);
        expect(typeof result.count).toBe("number");
        expect(typeof result.formatted).toBe("string");
      }
    });
  });

  describe("error handling", () => {
    test("should handle invalid path gracefully (returns empty results)", async () => {
      const result = await find.execute({
        path: "/nonexistent/path/that/does/not/exist",
        pattern: "**/*",
      });

      // Invalid paths don't throw errors, they just return empty results
      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        expect(result.count).toBe(0);
        expect(result.formatted).toBe("No matches found");
      }
    });

    test("should return error object for complex pattern with too many wildcards", async () => {
      const complexPattern = "*".repeat(20) + "test" + "*".repeat(20);

      const result = await find.execute({
        path: testDir,
        pattern: complexPattern,
      });

      expect(isErrorResult(result)).toBe(true);
      if (isErrorResult(result)) {
        expect(result.message).toContain("Pattern too complex");
      }
    });

    test("should return error object for pattern with too many segments", async () => {
      const segmentedPattern = Array(10).fill("*word*").join("");

      const result = await find.execute({
        path: testDir,
        pattern: segmentedPattern,
      });

      expect(isErrorResult(result)).toBe(true);
      if (isErrorResult(result)) {
        expect(result.message).toContain("Pattern too complex");
      }
    });

    test("should return error object for too many pipe-separated patterns", async () => {
      const manyPatterns = Array(60).fill("*.js").join("|");

      const result = await find.execute({
        path: testDir,
        pattern: manyPatterns,
      });

      expect(isErrorResult(result)).toBe(true);
      if (isErrorResult(result)) {
        expect(result.message).toContain("Pattern too complex");
      }
    });

    test("should return error object for pattern that is too long", async () => {
      const longPattern = "a".repeat(350);

      const result = await find.execute({
        path: testDir,
        pattern: longPattern,
      });

      expect(isErrorResult(result)).toBe(true);
      if (isErrorResult(result)) {
        expect(result.message).toContain("too long");
      }
    });

    test("should return error object for pattern with high complexity score", async () => {
      const complexPattern =
        "*test*file*name*pattern*search*complex*very*hard*";

      const result = await find.execute({
        path: testDir,
        pattern: complexPattern,
      });

      expect(isErrorResult(result)).toBe(true);
      if (isErrorResult(result)) {
        expect(result.message).toContain("has too many wildcard segments");
      }
    });

    test("should handle empty pattern gracefully", async () => {
      const result = await find.execute({
        path: testDir,
        pattern: "",
      });

      // Empty pattern should default to "**/*" and work fine
      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        expect(result.count).toBeGreaterThan(0);
      }
    });

    test("should handle whitespace-only pattern", async () => {
      const result = await find.execute({
        path: testDir,
        pattern: "   ",
      });

      // Whitespace pattern should be trimmed and default to "**/*"
      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        expect(result.count).toBeGreaterThan(0);
      }
    });
  });

  describe("pattern preprocessing", () => {
    test("should preprocess simple filename patterns", async () => {
      const result = await find.execute({
        path: testDir,
        pattern: "*.js",
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        expect(result.preprocessedPatterns).toContain("**/*.js");
      }
    });

    test("should handle contains patterns", async () => {
      const result = await find.execute({
        path: testDir,
        pattern: "*test*",
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        expect(result.preprocessedPatterns).toContain("**/*test*");
      }
    });

    test("should not modify patterns that already start with **", async () => {
      const result = await find.execute({
        path: testDir,
        pattern: "**/*.ts",
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        expect(result.preprocessedPatterns).toContain("**/*.ts");
      }
    });
  });

  describe("default exclusions", () => {
    test("should always exclude .chara directory", async () => {
      const charaDir = join(testDir, ".chara");
      await mkdir(charaDir, { recursive: true });
      await writeFile(join(charaDir, "config.json"), "{}");

      const result = await find.execute({
        path: testDir,
        pattern: "**/*",
        includeHidden: true,
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        const charaFiles = result.results.filter((r) =>
          r.path.includes(".chara")
        );
        expect(charaFiles.length).toBe(0);
      }
    });

    test("should always exclude node_modules directory", async () => {
      const nodeModulesDir = join(testDir, "node_modules");
      await mkdir(nodeModulesDir, { recursive: true });
      await writeFile(join(nodeModulesDir, "package.json"), "{}");

      const result = await find.execute({
        path: testDir,
        pattern: "**/*",
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        const nodeModulesFiles = result.results.filter((r) =>
          r.path.includes("node_modules")
        );
        expect(nodeModulesFiles.length).toBe(0);
      }
    });

    test("should always exclude .git directory", async () => {
      const gitDir = join(testDir, ".git");
      await mkdir(gitDir, { recursive: true });
      await writeFile(join(gitDir, "config"), "");

      const result = await find.execute({
        path: testDir,
        pattern: "**/*",
        includeHidden: true,
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        // Check that .git directory contents are excluded, but .gitignore file may still be present
        const gitDirFiles = result.results.filter((r) =>
          r.path.startsWith(".git/")
        );
        expect(gitDirFiles.length).toBe(0);
      }
    });
  });

  describe("result formatting", () => {
    test("should format results with file and directory indicators", async () => {
      const result = await find.execute({
        path: testDir,
        pattern: "**/*",
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        expect(result.formatted).toBeDefined();
        expect(typeof result.formatted).toBe("string");

        if (result.count > 0) {
          expect(result.formatted).toMatch(/\[FILE\]|\[DIR\]/);
        }
      }
    });

    test("should return 'No matches found' when no results", async () => {
      const result = await find.execute({
        path: testDir,
        pattern: "*.nonexistent",
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result)) {
        expect(result.count).toBe(0);
        expect(result.formatted).toBe("No matches found");
      }
    });
  });

  describe("result structure", () => {
    test("should return correct result structure for files", async () => {
      const result = await find.execute({
        path: testDir,
        pattern: "*.js",
      });

      expect(isErrorResult(result)).toBe(false);
      if (isSuccessResult(result) && result.results.length > 0) {
        const file = result.results[0];
        if (file) {
          expect(file).toHaveProperty("path");
          expect(file).toHaveProperty("type");
          expect(file).toHaveProperty("relativePath");
          expect(file).toHaveProperty("absolutePath");

          expect(typeof file.path).toBe("string");
          expect(["file", "directory"]).toContain(file.type);
          expect(typeof file.relativePath).toBe("string");
          expect(typeof file.absolutePath).toBe("string");
        }
      }
    });
  });
});
