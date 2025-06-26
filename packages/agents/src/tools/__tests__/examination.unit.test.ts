import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  mock,
  spyOn,
} from "bun:test";
import { examination } from "../examination";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

// Helper to create a mock ReadableStream with text content
function createMockStream(content: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(content));
      controller.close();
    },
  });
}

// Helper to create empty stream
function createEmptyStream(): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.close();
    },
  });
}

// Test data fixtures
const mockTypeScriptOutput = `src/main.ts(15,8): error TS2322: Type 'string' is not assignable to type 'number'.
src/main.ts(23,12): error TS2304: Cannot find name 'undefinedVariable'.
src/utils.ts(5,1): warning TS6133: 'unusedVar' is declared but its value is never read.`;

const mockESLintOutput = JSON.stringify([
  {
    filePath: "/project/src/main.ts",
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
        column: 8,
        severity: 1,
        message: "Unused variable 'test'",
        ruleId: "no-unused-vars",
      },
    ],
  },
  {
    filePath: "/project/src/utils.ts",
    messages: [
      {
        line: 3,
        column: 1,
        severity: 2,
        message: "Expected indentation of 2 spaces",
        ruleId: "indent",
      },
    ],
  },
]);

const mockPrettierOutput = `src/main.ts
src/components/Header.tsx`;

const mockUnitTestOutput = `
FAIL src/components/Button.test.ts
  ● Button component › should render correctly
    Expected component to render properly

    at Object.<anonymous> (src/components/Button.test.ts:10:5)

  ● Button component › should handle click events
    Click handler not called

    at Object.<anonymous> (src/components/Button.test.ts:15:8)

✗ 2 failed, 3 passed
`;

const mockUnitTestSuccess = `
✓ All tests passed
✓ 15 passed
`;

const mockPackageJsonWithTests = JSON.stringify({
  name: "test-project",
  scripts: {
    test: "bun test",
    build: "tsc",
  },
});

const mockPackageJsonNoTests = JSON.stringify({
  name: "test-project",
  scripts: {
    build: "tsc",
  },
});

describe("examination tool - unit tests", () => {
  const testDir = join(process.cwd(), "tmp", "examination-unit-test");
  const originalCwd = process.cwd();
  const originalSpawn = Bun.spawn;

  beforeAll(async () => {
    // Create test directory structure
    await mkdir(testDir, { recursive: true });
    process.chdir(testDir);

    // Create basic project structure
    await writeFile(
      "package.json",
      JSON.stringify(
        {
          name: "test-project",
          version: "1.0.0",
          devDependencies: {
            typescript: "^5.0.0",
            eslint: "^8.0.0",
            prettier: "^3.0.0",
          },
        },
        null,
        2,
      ),
    );

    await writeFile(
      "tsconfig.json",
      JSON.stringify({
        compilerOptions: {
          target: "ES2020",
          module: "commonjs",
          strict: true,
        },
      }),
    );

    await mkdir("src", { recursive: true });
    await writeFile("src/main.ts", "const x: number = 'string';");
    await writeFile("src/utils.ts", "export const helper = () => {};");
  });

  afterAll(async () => {
    process.chdir(originalCwd);
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
    // Restore original Bun.spawn
    Bun.spawn = originalSpawn;
  });

  beforeEach(() => {
    // Mock Bun.spawn to return empty successful results by default
    Bun.spawn = mock((args: string[]) => ({
      stdout: createEmptyStream(),
      stderr: createEmptyStream(),
      exited: Promise.resolve(0),
    }));
  });

  afterEach(() => {
    // Clean up mocks
    if (Bun.spawn && "mockClear" in Bun.spawn) {
      (Bun.spawn as any).mockClear();
    }
  });

  describe("detectProjectType", () => {
    test("should detect Node.js project with package.json", async () => {
      const result = await examination.execute({});
      expect(result).toMatch(/Project types detected:.*nodejs/);
    });

    test("should detect TypeScript project with tsconfig.json", async () => {
      const result = await examination.execute({});
      expect(result).toMatch(/Project types detected:.*typescript/);
    });

    test("should detect TypeScript from package.json dependencies", async () => {
      const result = await examination.execute({});
      expect(result).toMatch(/Project types detected:.*typescript/);
    });

    test("should handle missing package.json gracefully", async () => {
      const tempDir = join(testDir, "no-package");
      await mkdir(tempDir, { recursive: true });
      const originalCwd = process.cwd();

      try {
        process.chdir(tempDir);
        const result = await examination.execute({});
        expect(result).toContain(
          "doesn't appear to be a JavaScript or TypeScript project",
        );
      } finally {
        process.chdir(originalCwd);
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("TypeScript diagnostics parsing", () => {
    test("should parse TypeScript compiler output correctly", async () => {
      Bun.spawn = mock((args: string[]) => {
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

      const result = await examination.execute({ path: "src/main.ts" });

      expect(result).toContain("Found");
      expect(result).toContain("error");
      expect(result).toContain(
        "Type 'string' is not assignable to type 'number'",
      );
      expect(result).toContain("[typescript]");
    });

    test("should handle TypeScript success case", async () => {
      Bun.spawn = mock(() => ({
        stdout: createEmptyStream(),
        stderr: createEmptyStream(),
        exited: Promise.resolve(0),
      }));

      const result = await examination.execute({ path: "src/utils.ts" });
      expect(result).toContain("No errors or warnings found");
    });

    test("should handle TypeScript tool not found", async () => {
      const consoleErrorSpy = spyOn(console, "error").mockImplementation(
        () => {},
      );

      Bun.spawn = mock((args: string[]) => {
        if (args.includes("tsc")) {
          throw new Error('Executable not found in $PATH: "tsc"');
        }
        return {
          stdout: createEmptyStream(),
          stderr: createEmptyStream(),
          exited: Promise.resolve(0),
        };
      });

      const result = await examination.execute({ path: "src/main.ts" });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "TypeScript check failed:",
        expect.any(Error),
      );
      expect(result).toContain("No errors or warnings found");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("ESLint diagnostics parsing", () => {
    test("should parse ESLint JSON output correctly", async () => {
      Bun.spawn = mock((args: string[]) => {
        if (args.includes("eslint")) {
          return {
            stdout: createMockStream(mockESLintOutput),
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

      expect(result).toContain("Project diagnostic summary");
      expect(result).toContain("error(s)");
      expect(result).toContain("warning(s)");
    });

    test("should handle empty ESLint output", async () => {
      Bun.spawn = mock(() => ({
        stdout: createEmptyStream(),
        stderr: createEmptyStream(),
        exited: Promise.resolve(0),
      }));

      const result = await examination.execute({ path: "src/main.ts" });
      expect(result).toContain("No errors or warnings found");
    });

    test("should handle ESLint tool not found", async () => {
      const consoleErrorSpy = spyOn(console, "error").mockImplementation(
        () => {},
      );

      Bun.spawn = mock((args: string[]) => {
        if (args.includes("eslint")) {
          throw new Error('Executable not found in $PATH: "eslint"');
        }
        return {
          stdout: createEmptyStream(),
          stderr: createEmptyStream(),
          exited: Promise.resolve(0),
        };
      });

      const result = await examination.execute({});

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "ESLint check failed:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Unit test execution", () => {
    test("should parse unit test failures correctly", async () => {
      // Create package.json with test script
      await writeFile("package.json", mockPackageJsonWithTests);

      Bun.spawn = mock((args: string[]) => {
        if (args.includes("test")) {
          return {
            stdout: createMockStream(mockUnitTestOutput),
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

      expect(result).toContain("Project diagnostic summary");
      expect(result).toContain("error(s)");
      expect(result).toContain("warning(s)");
    });

    test("should handle successful test runs", async () => {
      await writeFile("package.json", mockPackageJsonWithTests);

      Bun.spawn = mock((args: string[]) => {
        if (args.includes("test")) {
          return {
            stdout: createMockStream(mockUnitTestSuccess),
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
      expect(result).toContain("No errors or warnings found");
    });

    test("should skip tests when no test script exists", async () => {
      await writeFile("package.json", mockPackageJsonNoTests);

      let testCalled = false;
      Bun.spawn = mock((args: string[]) => {
        if (args.includes("test")) {
          testCalled = true;
        }
        return {
          stdout: createEmptyStream(),
          stderr: createEmptyStream(),
          exited: Promise.resolve(0),
        };
      });

      await examination.execute({});
      expect(testCalled).toBe(false);
    });

    test("should handle test execution errors", async () => {
      await writeFile("package.json", mockPackageJsonWithTests);

      const consoleErrorSpy = spyOn(console, "error").mockImplementation(
        () => {},
      );

      Bun.spawn = mock((args: string[]) => {
        if (args.includes("test")) {
          throw new Error("Test execution failed");
        }
        return {
          stdout: createEmptyStream(),
          stderr: createEmptyStream(),
          exited: Promise.resolve(0),
        };
      });

      const result = await examination.execute({});

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Unit test execution failed:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    test("should skip tests for file-specific analysis", async () => {
      await writeFile("package.json", mockPackageJsonWithTests);

      let testCalled = false;
      Bun.spawn = mock((args: string[]) => {
        if (args.includes("test")) {
          testCalled = true;
        }
        return {
          stdout: createEmptyStream(),
          stderr: createEmptyStream(),
          exited: Promise.resolve(0),
        };
      });

      await examination.execute({ path: "src/main.ts" });
      expect(testCalled).toBe(false);
    });
  });

  describe("Prettier diagnostics parsing", () => {
    test("should parse Prettier check output correctly", async () => {
      Bun.spawn = mock((args: string[]) => {
        if (args.includes("prettier")) {
          return {
            stdout: createMockStream(mockPrettierOutput),
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

      expect(result).toContain("Project diagnostic summary");
      expect(result).toContain("warning(s)");
    });

    test("should handle Prettier success case", async () => {
      Bun.spawn = mock((args: string[]) => {
        if (args.includes("prettier")) {
          return {
            stdout: createEmptyStream(),
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
      expect(result).toContain("No errors or warnings found");
    });

    test("should handle Prettier tool not found", async () => {
      const consoleErrorSpy = spyOn(console, "error").mockImplementation(
        () => {},
      );

      Bun.spawn = mock((args: string[]) => {
        if (args.includes("prettier")) {
          throw new Error('Executable not found in $PATH: "prettier"');
        }
        return {
          stdout: createEmptyStream(),
          stderr: createEmptyStream(),
          exited: Promise.resolve(0),
        };
      });

      const result = await examination.execute({});

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Prettier check failed:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("diagnostic aggregation", () => {
    test("should aggregate multiple diagnostic sources correctly", async () => {
      const currentDir = process.cwd();

      Bun.spawn = mock((args: string[]) => {
        if (args.includes("tsc")) {
          return {
            stdout: createMockStream(
              "src/main.ts(1,1): error TS2322: Test error.",
            ),
            stderr: createEmptyStream(),
            exited: Promise.resolve(1),
          };
        }
        if (args.includes("eslint")) {
          const output = JSON.stringify([
            {
              filePath: join(currentDir, "src/main.ts"),
              messages: [
                {
                  line: 2,
                  column: 1,
                  severity: 1,
                  message: "ESLint warning",
                  ruleId: "test-rule",
                },
              ],
            },
          ]);
          return {
            stdout: createMockStream(output),
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

      expect(result).toContain("Found 1 error(s) and 1 warning(s)");
      expect(result).toContain("Test error");
      expect(result).toContain("ESLint warning");
      expect(result).toContain("[typescript]");
      expect(result).toContain("[eslint]");
    });

    test("should handle mixed severity levels correctly", async () => {
      Bun.spawn = mock((args: string[]) => {
        if (args.includes("tsc")) {
          const tsOutput = `src/main.ts(1,1): error TS2322: Error message.
src/main.ts(2,1): warning TS6133: Warning message.
src/main.ts(3,1): info TS0000: Info message.`;
          return {
            stdout: createMockStream(tsOutput),
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

      const result = await examination.execute({ path: "src/main.ts" });

      expect(result).toContain("❌ error at line 1:1");
      expect(result).toContain("⚠️ warning at line 2:1");
      expect(result).toContain("⚠️ info at line 3:1");
    });
  });

  describe("path handling", () => {
    test("should handle non-existent file path", async () => {
      const result = await examination.execute({ path: "src/nonexistent.ts" });

      expect(result).toContain("Error: Could not find path");
      expect(result).toContain("src/nonexistent.ts");
    });

    test("should handle empty path parameter", async () => {
      const result = await examination.execute({ path: "" });

      expect(result).toContain("Project types detected:");
    });

    test("should handle relative path resolution", async () => {
      const result = await examination.execute({ path: "src/main.ts" });

      expect(typeof result).toBe("string");
      expect(result).not.toContain("Error:");
    });

    test("should filter diagnostics for specific file", async () => {
      Bun.spawn = mock((args: string[]) => {
        if (args.includes("tsc")) {
          const output = `src/main.ts(1,1): error TS2322: Main file error.
src/utils.ts(1,1): error TS2322: Utils file error.`;
          return {
            stdout: createMockStream(output),
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

      const result = await examination.execute({ path: "src/main.ts" });

      expect(result).toContain("Main file error");
      expect(result).not.toContain("Utils file error");
    });
  });

  describe("tool configuration", () => {
    test("should skip ESLint for non-JS/TS files", async () => {
      await writeFile("README.md", "# Test");

      let eslintCalled = false;
      Bun.spawn = mock((args: string[]) => {
        if (args.includes("eslint")) {
          eslintCalled = true;
        }
        return {
          stdout: createEmptyStream(),
          stderr: createEmptyStream(),
          exited: Promise.resolve(0),
        };
      });

      const result = await examination.execute({ path: "README.md" });
      expect(result).toContain("No errors or warnings found");
      expect(eslintCalled).toBe(false);
    });

    test("should run TypeScript diagnostics for TS files", async () => {
      let tscCalled = false;

      Bun.spawn = mock((args: string[]) => {
        if (args.includes("tsc")) {
          tscCalled = true;
        }
        return {
          stdout: createEmptyStream(),
          stderr: createEmptyStream(),
          exited: Promise.resolve(0),
        };
      });

      await examination.execute({ path: "src/main.ts" });
      expect(tscCalled).toBe(true);
    });

    test("should use correct command line arguments", async () => {
      let receivedArgs: string[] = [];

      Bun.spawn = mock((args: string[]) => {
        if (args.includes("tsc")) {
          receivedArgs = args;
        }
        return {
          stdout: createEmptyStream(),
          stderr: createEmptyStream(),
          exited: Promise.resolve(0),
        };
      });

      await examination.execute({ path: "src/main.ts" });

      expect(receivedArgs).toContain("npx");
      expect(receivedArgs).toContain("tsc");
      expect(receivedArgs).toContain("--noEmit");
      expect(receivedArgs).toContain("--pretty");
      expect(receivedArgs).toContain("false");
    });
  });

  describe("error handling", () => {
    test("should handle general execution errors", async () => {
      const originalCwd = process.cwd;
      process.cwd = () => {
        throw new Error("Cannot access current directory");
      };

      const result = await examination.execute({});

      expect(result).toContain("Error running diagnostics:");
      expect(result).toContain("Cannot access current directory");

      process.cwd = originalCwd;
    });

    test("should handle promise rejection in diagnostic tools", async () => {
      const consoleErrorSpy = spyOn(console, "error").mockImplementation(
        () => {},
      );

      Bun.spawn = mock(() => {
        throw new Error("Process spawn failed");
      });

      const result = await examination.execute({});

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result).toContain("No errors or warnings found");

      consoleErrorSpy.mockRestore();
    });

    test("should handle malformed JSON from tools", async () => {
      const consoleErrorSpy = spyOn(console, "error").mockImplementation(
        () => {},
      );

      Bun.spawn = mock((args: string[]) => {
        if (args.includes("eslint")) {
          return {
            stdout: createMockStream("{ invalid json"),
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

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "ESLint check failed:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("output formatting", () => {
    test("should format project-wide summary correctly", async () => {
      Bun.spawn = mock((args: string[]) => {
        if (args.includes("tsc")) {
          return {
            stdout: createMockStream(
              "src/main.ts(1,1): error TS2322: Test error.",
            ),
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

      expect(result).toMatch(/Project types detected: .+/);
      expect(result).toContain("Project diagnostic summary:");
      expect(result).toContain("Total:");
      expect(result).toContain("Files with issues:");
      expect(result).toMatch(/src\/main\.ts: \d+ error\(s\), \d+ warning\(s\)/);
    });

    test("should format file-specific diagnostics correctly", async () => {
      Bun.spawn = mock((args: string[]) => {
        if (args.includes("tsc")) {
          return {
            stdout: createMockStream(
              "src/main.ts(15,8): error TS2322: Type error message.",
            ),
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

      const result = await examination.execute({ path: "src/main.ts" });

      expect(result).toContain("Found 1 error(s) and 0 warning(s):");
      expect(result).toContain("❌ error at line 15:8: Type error message");
      expect(result).toContain("[typescript]");
    });

    test("should handle no issues found case", async () => {
      Bun.spawn = mock(() => ({
        stdout: createEmptyStream(),
        stderr: createEmptyStream(),
        exited: Promise.resolve(0),
      }));

      const result = await examination.execute({});

      expect(result).toContain("No errors or warnings found in the project");
    });
  });

  describe("tool metadata", () => {
    test("should have correct tool description", () => {
      expect(examination.description).toContain(
        "JavaScript/TypeScript projects",
      );
      expect(examination.description).toContain(
        "TypeScript compiler, ESLint, Prettier, and unit test execution",
      );
      expect(examination.description).toContain("<example>");
      expect(examination.description).toContain("<guidelines>");
    });

    test("should have correct parameter schema", () => {
      expect(examination.parameters).toBeDefined();
      expect(examination.parameters.shape).toHaveProperty("path");
    });

    test("should accept optional path parameter", () => {
      const pathParam = examination.parameters.shape.path;
      expect(pathParam).toBeDefined();
      expect(pathParam.isOptional()).toBe(true);
    });
  });

  describe("integration scenarios", () => {
    test("should handle project with multiple file types", async () => {
      await writeFile(
        "src/component.jsx",
        "export default () => <div>Hello</div>;",
      );
      await writeFile("src/styles.css", "body { margin: 0; }");
      await writeFile("package.json", mockPackageJsonWithTests);

      Bun.spawn = mock((args: string[]) => {
        if (args.includes("tsc")) {
          return {
            stdout: createMockStream(
              "src/main.ts(1,1): error TS2322: TS error.",
            ),
            stderr: createEmptyStream(),
            exited: Promise.resolve(1),
          };
        }
        if (args.includes("eslint")) {
          const output = JSON.stringify([
            {
              filePath: join(process.cwd(), "src/component.jsx"),
              messages: [
                {
                  line: 1,
                  column: 1,
                  severity: 2,
                  message: "JSX error",
                  ruleId: "react/jsx-key",
                },
              ],
            },
          ]);
          return {
            stdout: createMockStream(output),
            stderr: createEmptyStream(),
            exited: Promise.resolve(0),
          };
        }
        if (args.includes("test")) {
          return {
            stdout: createMockStream(mockUnitTestSuccess),
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

      expect(result).toContain("Project diagnostic summary");
      expect(result).toContain("src/main.ts");
      expect(result).toContain("src/component.jsx");
    });

    test("should handle concurrent diagnostic execution", async () => {
      await writeFile("package.json", mockPackageJsonWithTests);

      let tscCallCount = 0;
      let eslintCallCount = 0;
      let testCallCount = 0;

      Bun.spawn = mock((args: string[]) => {
        if (args.includes("tsc")) {
          tscCallCount++;
          return {
            stdout: createMockStream(
              "src/main.ts(1,1): error TS2322: TS error.",
            ),
            stderr: createEmptyStream(),
            exited: Promise.resolve(1),
          };
        }
        if (args.includes("eslint")) {
          eslintCallCount++;
          return {
            stdout: createEmptyStream(),
            stderr: createEmptyStream(),
            exited: Promise.resolve(0),
          };
        }
        if (args.includes("test")) {
          testCallCount++;
          return {
            stdout: createMockStream(mockUnitTestSuccess),
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

      await examination.execute({});

      expect(tscCallCount).toBe(1);
      expect(eslintCallCount).toBe(1);
      expect(testCallCount).toBe(1);
    });

    test("should handle large diagnostic output efficiently", async () => {
      await writeFile("package.json", mockPackageJsonWithTests);

      const largeOutput = Array.from(
        { length: 100 },
        (_, i) => `src/file${i}.ts(1,1): error TS2322: Error in file ${i}.`,
      ).join("\n");

      Bun.spawn = mock((args: string[]) => {
        if (args.includes("tsc")) {
          return {
            stdout: createMockStream(largeOutput),
            stderr: createEmptyStream(),
            exited: Promise.resolve(1),
          };
        }
        if (args.includes("test")) {
          return {
            stdout: createMockStream(mockUnitTestSuccess),
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

      expect(result).toContain("100 error(s)");
      expect(result).toContain("Project diagnostic summary");
    });

    test("should aggregate unit test failures with other diagnostics", async () => {
      await writeFile("package.json", mockPackageJsonWithTests);

      Bun.spawn = mock((args: string[]) => {
        if (args.includes("tsc")) {
          return {
            stdout: createMockStream(
              "src/main.ts(1,1): error TS2322: TS error.",
            ),
            stderr: createEmptyStream(),
            exited: Promise.resolve(1),
          };
        }
        if (args.includes("test")) {
          return {
            stdout: createMockStream(mockUnitTestOutput),
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

      expect(result).toContain("Project diagnostic summary");
      expect(result).toContain("error(s)");
      expect(result).toContain("src/main.ts");
      expect(result).toContain("src/components/Button.test.ts");
    });
  });
});
