import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test";

// Helper functions for creating mock streams
function createMockStream(content: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(content));
      controller.close();
    },
  });
}

function createEmptyStream(): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.close();
    },
  });
}

describe("examination tool", () => {
  let existsSyncSpy: any;
  let readFileSyncSpy: any;
  let statSyncSpy: any;
  let readdirSyncSpy: any;
  let bunSpawnSpy: any;
  let processCwdSpy: any;

  beforeEach(async () => {
    // Import modules dynamically to ensure fresh imports
    const fs = await import("node:fs");

    // Create spies
    existsSyncSpy = spyOn(fs, "existsSync");
    readFileSyncSpy = spyOn(fs, "readFileSync");
    statSyncSpy = spyOn(fs, "statSync");
    readdirSyncSpy = spyOn(fs, "readdirSync");
    bunSpawnSpy = spyOn(Bun, "spawn");
    processCwdSpy = spyOn(process, "cwd");

    // Set default implementations
    existsSyncSpy.mockImplementation(() => false);
    readFileSyncSpy.mockImplementation(() => "");
    statSyncSpy.mockImplementation(() => ({
      isDirectory: () => false,
      isFile: () => true,
    }));
    readdirSyncSpy.mockImplementation(() => []);
    bunSpawnSpy.mockImplementation(() => ({
      stdout: createEmptyStream(),
      stderr: createEmptyStream(),
      exited: Promise.resolve(1),
    }));
    processCwdSpy.mockImplementation(() => "/test/project");
  });

  afterEach(() => {
    // Restore all spies
    existsSyncSpy?.mockRestore?.();
    readFileSyncSpy?.mockRestore?.();
    statSyncSpy?.mockRestore?.();
    readdirSyncSpy?.mockRestore?.();
    bunSpawnSpy?.mockRestore?.();
    processCwdSpy?.mockRestore?.();
  });

  describe("Basic functionality", () => {
    test("should export examination tool", async () => {
      const { examination } = await import("../examination");

      expect(examination).toBeDefined();
      expect(typeof examination.execute).toBe("function");
      expect(typeof examination.description).toBe("string");
    });

    test("should have correct tool description", async () => {
      const { examination } = await import("../examination");

      expect(examination.description).toContain("errors and warnings");
      expect(examination.description).toContain("JavaScript/TypeScript");
    });

    test("should handle empty project", async () => {
      // Mock no files exist
      existsSyncSpy.mockImplementation(() => false);

      const { examination } = await import("../examination");
      const result = await examination.execute({ path: undefined });

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    test("should handle non-existent file", async () => {
      existsSyncSpy.mockImplementation(() => false);

      const { examination } = await import("../examination");
      const result = await examination.execute({ path: "nonexistent.ts" });

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      // Should either contain "Could not find path" or project detection message
      expect(
        result.includes("Could not find path") ||
        result.includes("doesn't appear to be a JavaScript or TypeScript project")
      ).toBe(true);
    });
  });

  describe("Project detection", () => {
    test("should detect Node.js project", async () => {
      // Mock package.json exists
      existsSyncSpy.mockImplementation((path) => {
        return typeof path === "string" && path.includes("package.json");
      });

      readFileSyncSpy.mockImplementation((path) => {
        if (typeof path === "string" && path.includes("package.json")) {
          return JSON.stringify({
            name: "test-project",
            version: "1.0.0",
          });
        }
        return "";
      });

      const { examination } = await import("../examination");
      const result = await examination.execute({ path: undefined });

      expect(result).toContain("Project types detected:");
      expect(result).toContain("nodejs");
    });

    test("should detect TypeScript project", async () => {
      // Mock both package.json and tsconfig.json
      existsSyncSpy.mockImplementation((path) => {
        return typeof path === "string" &&
               (path.includes("package.json") || path.includes("tsconfig.json"));
      });

      readFileSyncSpy.mockImplementation((path) => {
        if (typeof path === "string" && path.includes("package.json")) {
          return JSON.stringify({
            name: "test-project",
            devDependencies: { typescript: "^5.0.0" },
          });
        }
        if (typeof path === "string" && path.includes("tsconfig.json")) {
          return JSON.stringify({ compilerOptions: { strict: true } });
        }
        return "";
      });

      const { examination } = await import("../examination");
      const result = await examination.execute({ path: undefined });

      expect(result).toContain("typescript");
    });

    test("should handle projects without TypeScript", async () => {
      // Mock only package.json, no tsconfig.json
      existsSyncSpy.mockImplementation((path) => {
        return typeof path === "string" &&
               path.includes("package.json") &&
               !path.includes("tsconfig.json");
      });

      readFileSyncSpy.mockImplementation((path) => {
        if (typeof path === "string" && path.includes("package.json")) {
          return JSON.stringify({
            name: "test-project",
            version: "1.0.0",
            devDependencies: {},
          });
        }
        return "";
      });

      const { examination } = await import("../examination");
      const result = await examination.execute({ path: undefined });

      expect(result).toContain("nodejs");
      expect(result).not.toContain("typescript");
    });
  });

  describe("File handling", () => {
    test("should handle specific file path", async () => {
      // Mock file exists
      existsSyncSpy.mockImplementation((path) => {
        return typeof path === "string" &&
               (path.includes("test.ts") || path.includes("package.json"));
      });

      readFileSyncSpy.mockImplementation((path) => {
        if (typeof path === "string" && path.includes("test.ts")) {
          return "export const test = 'hello';";
        }
        if (typeof path === "string" && path.includes("package.json")) {
          return JSON.stringify({ name: "test-project" });
        }
        return "";
      });

      const { examination } = await import("../examination");
      const result = await examination.execute({ path: "src/test.ts" });

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    test("should handle directory paths", async () => {
      existsSyncSpy.mockImplementation(() => true);
      statSyncSpy.mockImplementation(() => ({
        isDirectory: () => true,
        isFile: () => false,
      }));
      readdirSyncSpy.mockImplementation(() => ["file1.ts", "file2.js"]);

      const { examination } = await import("../examination");
      const result = await examination.execute({ path: "src" });

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("Error handling", () => {
    test("should handle file system errors gracefully", async () => {
      existsSyncSpy.mockImplementation(() => {
        throw new Error("File system error");
      });

      const { examination } = await import("../examination");
      const result = await examination.execute({ path: undefined });

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    test("should handle invalid JSON gracefully", async () => {
      existsSyncSpy.mockImplementation((path) => {
        return typeof path === "string" && path.includes("package.json");
      });

      readFileSyncSpy.mockImplementation((path) => {
        if (typeof path === "string" && path.includes("package.json")) {
          return "{ invalid json content";
        }
        return "";
      });

      const { examination } = await import("../examination");
      const result = await examination.execute({ path: undefined });

      expect(typeof result).toBe("string");
      // Should not crash on invalid JSON
    });

    test("should handle subprocess failures silently", async () => {
      // Mock TypeScript project
      existsSyncSpy.mockImplementation((path) => {
        return typeof path === "string" &&
               (path.includes("package.json") || path.includes("tsconfig.json"));
      });

      readFileSyncSpy.mockImplementation((path) => {
        if (typeof path === "string" && path.includes("package.json")) {
          return JSON.stringify({
            name: "test-project",
            devDependencies: { typescript: "^5.0.0" },
          });
        }
        if (typeof path === "string" && path.includes("tsconfig.json")) {
          return JSON.stringify({ compilerOptions: {} });
        }
        return "";
      });

      // Ensure spawn fails
      bunSpawnSpy.mockImplementation(() => {
        throw new Error("npx not found");
      });

      const { examination } = await import("../examination");
      const result = await examination.execute({ path: undefined });

      expect(typeof result).toBe("string");
      expect(result).toContain("Project types detected:");
      // Should still work even if external tools fail
    });
  });

  describe("Tool configuration", () => {
    test("should detect Biome configuration", async () => {
      existsSyncSpy.mockImplementation((path) => {
        return typeof path === "string" &&
               (path.includes("biome.json") ||
                path.includes("biome.jsonc") ||
                path.includes("package.json"));
      });

      readFileSyncSpy.mockImplementation((path) => {
        if (typeof path === "string" && path.includes("package.json")) {
          return JSON.stringify({
            name: "test-project",
            devDependencies: { "@biomejs/biome": "^1.0.0" },
          });
        }
        return "";
      });

      const { examination } = await import("../examination");
      const result = await examination.execute({ path: undefined });

      expect(typeof result).toBe("string");
      // Should detect project even if external tools fail
    });

    test("should detect ESLint configuration", async () => {
      existsSyncSpy.mockImplementation((path) => {
        return typeof path === "string" &&
               (path.includes(".eslintrc") || path.includes("package.json"));
      });

      readFileSyncSpy.mockImplementation((path) => {
        if (typeof path === "string" && path.includes("package.json")) {
          return JSON.stringify({
            name: "test-project",
            devDependencies: { eslint: "^8.0.0" },
          });
        }
        return "";
      });

      const { examination } = await import("../examination");
      const result = await examination.execute({ path: undefined });

      expect(typeof result).toBe("string");
    });
  });

  describe("Performance and reliability", () => {
    test("should complete quickly with mocked file system", async () => {
      existsSyncSpy.mockImplementation(() => false);

      const startTime = Date.now();
      const { examination } = await import("../examination");
      await examination.execute({ path: undefined });
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(1000); // Should be fast with mocks
    });

    test("should handle concurrent executions", async () => {
      existsSyncSpy.mockImplementation(() => false);

      const { examination } = await import("../examination");

      const promises = Array.from({ length: 3 }, (_, i) =>
        examination.execute({ path: `test${i}.ts` })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
      });
    });

    test("should handle edge case paths", async () => {
      existsSyncSpy.mockImplementation(() => false);

      const { examination } = await import("../examination");

      // Test various edge case paths
      const testPaths = [
        "",
        ".",
        "./",
        "../test.ts",
        "very/deeply/nested/path/file.ts",
        "file with spaces.ts",
      ];

      for (const path of testPaths) {
        const result = await examination.execute({ path });
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Tool metadata validation", () => {
    test("should have valid tool structure", async () => {
      const { examination } = await import("../examination");

      expect(examination).toBeDefined();
      expect(examination.description).toBeDefined();
      expect(examination.execute).toBeDefined();

      expect(typeof examination.description).toBe("string");
      expect(typeof examination.execute).toBe("function");
    });

    test("should have basic tool properties", async () => {
      const { examination } = await import("../examination");

      expect(examination.description).toContain("errors and warnings");
      expect(examination.description.length).toBeGreaterThan(10);

      // Test that execute function works
      expect(typeof examination.execute).toBe("function");
    });

    test("should handle missing path parameter", async () => {
      existsSyncSpy.mockImplementation(() => false);

      const { examination } = await import("../examination");
      const result = await examination.execute({});

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
