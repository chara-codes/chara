import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";

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

describe("examination tool - unit tests with spies", () => {
  let existsSyncSpy: any;
  let readFileSpy: any;
  let bunSpawnSpy: any;
  let processCwdSpy: any;

  beforeEach(async () => {
    // Import modules dynamically to ensure fresh imports
    const fs = await import("node:fs");
    const fsPromises = await import("node:fs/promises");

    // Create spies
    existsSyncSpy = spyOn(fs, "existsSync");
    readFileSpy = spyOn(fsPromises, "readFile");
    bunSpawnSpy = spyOn(Bun, "spawn");
    processCwdSpy = spyOn(process, "cwd");

    // Set default implementations
    existsSyncSpy.mockImplementation(() => false);
    readFileSpy.mockImplementation(() => Promise.resolve("{}"));
    bunSpawnSpy.mockImplementation(() => ({
      stdout: createEmptyStream(),
      stderr: createEmptyStream(),
      exited: Promise.resolve(0),
    }));
    processCwdSpy.mockImplementation(() => "/test/project");
  });

  afterEach(() => {
    // Restore all spies
    existsSyncSpy?.mockRestore?.();
    readFileSpy?.mockRestore?.();
    bunSpawnSpy?.mockRestore?.();
    processCwdSpy?.mockRestore?.();
  });

  describe("project detection", () => {
    test("should detect Node.js project with package.json", async () => {
      // Import examination tool after setting up mocks
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return path.includes("package.json");
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: { typescript: "^5.0.0" },
          }),
        ),
      );

      const result = await examination.execute({});

      expect(result).toContain("Project types detected:");
      expect(result).toContain("nodejs");
    });

    test("should detect TypeScript project", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return path.includes("package.json") || path.includes("tsconfig.json");
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: { typescript: "^5.0.0" },
          }),
        ),
      );

      const result = await examination.execute({});

      expect(result).toContain("typescript");
    });

    test("should detect Biome when configured", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return (
          path.includes("package.json") ||
          path.includes("biome.json") ||
          path.includes("tsconfig.json")
        );
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: {
              "@biomejs/biome": "^1.0.0",
              typescript: "^5.0.0",
            },
          }),
        ),
      );

      const result = await examination.execute({});

      expect(result).toContain("✅ Biome");
    });

    test("should detect ESLint when configured", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return (
          path.includes("package.json") ||
          path.includes(".eslintrc.json") ||
          path.includes("tsconfig.json")
        );
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: {
              eslint: "^8.0.0",
              typescript: "^5.0.0",
            },
          }),
        ),
      );

      const result = await examination.execute({});

      expect(result).toContain("✅ ESLint");
    });

    test("should detect Prettier when configured", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return (
          path.includes("package.json") ||
          path.includes(".prettierrc") ||
          path.includes("tsconfig.json")
        );
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: {
              prettier: "^3.0.0",
              typescript: "^5.0.0",
            },
          }),
        ),
      );

      const result = await examination.execute({});

      expect(result).toContain("✅ Prettier");
    });
  });

  describe("diagnostic parsing", () => {
    test("should parse TypeScript compiler output correctly", async () => {
      const { examination } = await import("../examination");

      const mockTypeScriptOutput = `src/main.ts(15,8): error TS2322: Type 'string' is not assignable to type 'number'.
src/main.ts(23,12): error TS2304: Cannot find name 'undefinedVariable'.`;

      existsSyncSpy.mockImplementation((path: string) => {
        return path.includes("package.json") || path.includes("tsconfig.json");
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: { typescript: "^5.0.0" },
          }),
        ),
      );
      bunSpawnSpy.mockImplementation(() => ({
        stdout: createMockStream(mockTypeScriptOutput),
        stderr: createEmptyStream(),
        exited: Promise.resolve(1),
      }));

      const result = await examination.execute({});

      expect(result).toContain("Total: 2 error(s), 0 warning(s)");
      expect(result).toContain(
        "✅ TypeScript - found 2 error(s), 0 warning(s)",
      );
    });

    test("should parse ESLint JSON output correctly", async () => {
      const { examination } = await import("../examination");

      const mockESLintOutput = JSON.stringify([
        {
          filePath: "/test/project/src/main.ts",
          messages: [
            {
              line: 10,
              column: 5,
              severity: 2,
              message: "Missing semicolon",
              ruleId: "semi",
            },
            {
              line: 15,
              column: 1,
              severity: 1,
              message: "Prefer const over let",
              ruleId: "prefer-const",
            },
          ],
        },
      ]);

      existsSyncSpy.mockImplementation((path: string) => {
        return (
          path.includes("package.json") ||
          path.includes("tsconfig.json") ||
          path.includes(".eslintrc.json")
        );
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: {
              typescript: "^5.0.0",
              eslint: "^8.0.0",
            },
          }),
        ),
      );
      bunSpawnSpy.mockImplementation((args: string[]) => {
        if (args.includes("eslint")) {
          return {
            stdout: createMockStream(mockESLintOutput),
            stderr: createEmptyStream(),
            exited: Promise.resolve(0),
          };
        }
        return {
          stdout: createEmptyStream(),
          stderr: createEmptyStream(),
          exited: Promise.resolve(0),
        };
      });

      const result = await examination.execute({});

      expect(result).toContain("Total: 1 error(s), 1 warning(s)");
      expect(result).toContain("✅ ESLint - found 1 error(s), 1 warning(s)");
    });

    test("should parse Biome JSON output correctly", async () => {
      const { examination } = await import("../examination");

      const mockBiomeOutput = JSON.stringify({
        diagnostics: [
          {
            location: {
              path: "src/main.ts",
              span: { start: { line: 5, column: 10 } },
            },
            severity: "error",
            description: "Missing semicolon",
            category: "lint/style",
          },
          {
            location: {
              path: "src/utils.ts",
              span: { start: { line: 12, column: 5 } },
            },
            severity: "warning",
            description: "Prefer const over let",
            category: "lint/nursery",
          },
        ],
      });

      existsSyncSpy.mockImplementation((path: string) => {
        return (
          path.includes("package.json") ||
          path.includes("tsconfig.json") ||
          path.includes("biome.json")
        );
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: {
              "@biomejs/biome": "^1.0.0",
              typescript: "^5.0.0",
            },
          }),
        ),
      );
      bunSpawnSpy.mockImplementation((args: string[]) => {
        if (args.includes("@biomejs/biome")) {
          return {
            stdout: createMockStream(mockBiomeOutput),
            stderr: createEmptyStream(),
            exited: Promise.resolve(1),
          };
        }
        return {
          stdout: createEmptyStream(),
          stderr: createEmptyStream(),
          exited: Promise.resolve(0),
        };
      });

      const result = await examination.execute({});

      expect(result).toContain("✅ Biome - found 1 error(s), 1 warning(s)");
    });
  });

  describe("tool execution tracking", () => {
    test("should show executed checks with status", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return (
          path.includes("package.json") ||
          path.includes("tsconfig.json") ||
          path.includes("biome.json")
        );
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: {
              "@biomejs/biome": "^1.0.0",
              typescript: "^5.0.0",
            },
          }),
        ),
      );

      const result = await examination.execute({});

      expect(result).toContain("Executed checks:");
      expect(result).toContain("✅ Biome");
      expect(result).toContain("✅ TypeScript");
      expect(result).toContain("⏭️ ESLint");
      expect(result).toContain("⏭️ Prettier");
    });

    test("should show reasons for skipped checks", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return path.includes("package.json") || path.includes("tsconfig.json");
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: { typescript: "^5.0.0" },
          }),
        ),
      );

      const result = await examination.execute({});

      expect(result).toContain("⏭️ Biome (not installed or configured)");
      expect(result).toContain("⏭️ ESLint (not installed or configured)");
      expect(result).toContain("⏭️ Prettier (not installed or configured)");
    });

    test("should show diagnostic counts for executed checks", async () => {
      const { examination } = await import("../examination");

      const mockTypeScriptOutput = `src/main.ts(15,8): error TS2322: Type 'string' is not assignable to type 'number'.`;

      existsSyncSpy.mockImplementation((path: string) => {
        return path.includes("package.json") || path.includes("tsconfig.json");
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: { typescript: "^5.0.0" },
          }),
        ),
      );
      bunSpawnSpy.mockImplementation((args: string[]) => {
        if (args.includes("tsc")) {
          return {
            stdout: createMockStream(mockTypeScriptOutput),
            stderr: createEmptyStream(),
            exited: Promise.resolve(1),
          };
        }
        return {
          stdout: createEmptyStream(),
          stderr: createEmptyStream(),
          exited: Promise.resolve(0),
        };
      });

      const result = await examination.execute({});

      expect(result).toContain(
        "✅ TypeScript - found 1 error(s), 0 warning(s)",
      );
    });
  });

  describe("file-specific analysis", () => {
    test("should handle specific file path", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return (
          path.includes("package.json") ||
          path.includes("tsconfig.json") ||
          path.includes("src/main.ts")
        );
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: { typescript: "^5.0.0" },
          }),
        ),
      );

      const result = await examination.execute({ path: "src/main.ts" });

      expect(typeof result).toBe("string");
      expect(result).not.toContain("Project types detected:");
    });

    test("should handle non-existent file path", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return path.includes("package.json") || path.includes("tsconfig.json");
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: { typescript: "^5.0.0" },
          }),
        ),
      );

      const result = await examination.execute({ path: "src/nonexistent.ts" });

      expect(result).toContain("Could not find path");
      expect(result).toContain("src/nonexistent.ts");
    });

    test("should skip tools not applicable to single files", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return (
          path.includes("package.json") ||
          path.includes("tsconfig.json") ||
          path.includes(".prettierrc") ||
          path.includes("src/main.ts")
        );
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: {
              typescript: "^5.0.0",
              prettier: "^3.0.0",
            },
          }),
        ),
      );

      const result = await examination.execute({ path: "src/main.ts" });

      expect(result).toContain(
        "⏭️ Prettier (skipped for single file analysis)",
      );
      expect(result).toContain("⏭️ Tests (skipped for single file analysis)");
    });
  });

  describe("error handling", () => {
    test("should handle projects without Node.js/TypeScript setup", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation(() => false);

      const result = await examination.execute({});

      expect(result).toContain(
        "This project doesn't appear to be a JavaScript or TypeScript project",
      );
    });

    test("should handle tool execution errors gracefully", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return path.includes("package.json") || path.includes("tsconfig.json");
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: { typescript: "^5.0.0" },
          }),
        ),
      );
      bunSpawnSpy.mockImplementation(() => {
        throw new Error("Tool execution failed");
      });

      const result = await examination.execute({});

      // Should not throw, but handle the error gracefully
      expect(typeof result).toBe("string");
      expect(result).toContain("TypeScript");
    });

    test("should handle malformed JSON output from tools", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return (
          path.includes("package.json") ||
          path.includes("tsconfig.json") ||
          path.includes(".eslintrc.json")
        );
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: {
              typescript: "^5.0.0",
              eslint: "^8.0.0",
            },
          }),
        ),
      );
      bunSpawnSpy.mockImplementation((args: string[]) => {
        if (args.includes("eslint")) {
          return {
            stdout: createMockStream("invalid json"),
            stderr: createEmptyStream(),
            exited: Promise.resolve(0),
          };
        }
        return {
          stdout: createEmptyStream(),
          stderr: createEmptyStream(),
          exited: Promise.resolve(0),
        };
      });

      const result = await examination.execute({});

      // Should handle malformed JSON gracefully
      expect(typeof result).toBe("string");
      expect(result).toContain("ESLint");
    });
  });

  describe("output formatting", () => {
    test("should format project-wide summary correctly", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return path.includes("package.json") || path.includes("tsconfig.json");
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: { typescript: "^5.0.0" },
          }),
        ),
      );

      const result = await examination.execute({});

      expect(result).toContain("Project types detected:");
      expect(result).toContain("Executed checks:");
      expect(result).toContain("nodejs, typescript");
    });

    test("should group diagnostics by source in detailed view", async () => {
      const { examination } = await import("../examination");

      const mockTypeScriptOutput = `src/main.ts(5,10): error TS1005: ';' expected.
src/main.ts(12,5): warning TS6133: 'unused' is declared but never used.`;

      existsSyncSpy.mockImplementation((path: string) => {
        return (
          path.includes("package.json") ||
          path.includes("tsconfig.json") ||
          path.includes("src/main.ts")
        );
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: { typescript: "^5.0.0" },
          }),
        ),
      );
      bunSpawnSpy.mockImplementation((args: string[]) => {
        if (args.includes("tsc")) {
          return {
            stdout: createMockStream(""),
            stderr: createMockStream(mockTypeScriptOutput),
            exited: Promise.resolve(1),
          };
        }
        if (args.includes("biome")) {
          return {
            stdout: createMockStream(""),
            stderr: createEmptyStream(),
            exited: Promise.resolve(0),
          };
        }
        return {
          stdout: createEmptyStream(),
          stderr: createEmptyStream(),
          exited: Promise.resolve(0),
        };
      });

      const result = await examination.execute({ path: "src/main.ts" });

      expect(result).toContain("--- TYPESCRIPT ---");
      expect(result).toContain("❌ error at line 5:10");
      expect(result).toContain("⚠️ warning at line 12:5");
    });

    test("should handle no issues found case", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return path.includes("package.json") || path.includes("tsconfig.json");
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: { typescript: "^5.0.0" },
          }),
        ),
      );

      const result = await examination.execute({});

      expect(result).toContain("No errors or warnings found in the project.");
    });
  });

  describe("performance optimizations", () => {
    test("should complete quickly with mocked operations", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return (
          path.includes("package.json") ||
          path.includes("tsconfig.json") ||
          path.includes("biome.json") ||
          path.includes(".eslintrc.json") ||
          path.includes(".prettierrc")
        );
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: {
              "@biomejs/biome": "^1.0.0",
              typescript: "^5.0.0",
              eslint: "^8.0.0",
              prettier: "^3.0.0",
            },
          }),
        ),
      );

      const startTime = Date.now();
      const result = await examination.execute({});
      const duration = Date.now() - startTime;

      expect(typeof result).toBe("string");
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });

    test("should handle concurrent tool execution efficiently", async () => {
      const { examination } = await import("../examination");

      existsSyncSpy.mockImplementation((path: string) => {
        return (
          path.includes("package.json") ||
          path.includes("tsconfig.json") ||
          path.includes("biome.json")
        );
      });
      readFileSpy.mockImplementation(() =>
        Promise.resolve(
          JSON.stringify({
            name: "test-project",
            devDependencies: {
              "@biomejs/biome": "^1.0.0",
              typescript: "^5.0.0",
            },
          }),
        ),
      );

      // Add delay to mock operations to test concurrency
      bunSpawnSpy.mockImplementation(() => {
        return {
          stdout: new ReadableStream({
            start(controller) {
              setTimeout(() => {
                controller.enqueue(new TextEncoder().encode(""));
                controller.close();
              }, 50);
            },
          }),
          stderr: new ReadableStream({
            start(controller) {
              controller.close();
            },
          }),
          exited: new Promise((resolve) => setTimeout(() => resolve(0), 50)),
        };
      });

      const startTime = Date.now();
      const result = await examination.execute({});
      const duration = Date.now() - startTime;

      expect(typeof result).toBe("string");
      // Should complete faster than sequential execution due to concurrency
      expect(duration).toBeLessThan(200);
    });
  });
});
