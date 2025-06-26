import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { examination } from "../examination";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

describe("examination", () => {
  const testDir = join(process.cwd(), "tmp", "tool-examination-test");
  const originalCwd = process.cwd();

  beforeAll(async () => {
    // Create test directory structure
    await mkdir(testDir, { recursive: true });
    process.chdir(testDir);

    // Create a simple TypeScript project
    await writeFile(
      "package.json",
      JSON.stringify(
        {
          name: "test-project",
          version: "1.0.0",
          scripts: {
            test: "bun test",
            build: "tsc",
          },
          devDependencies: {
            typescript: "^5.0.0",
            "@types/node": "^20.0.0",
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
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
        },
      }),
    );

    await mkdir("src", { recursive: true });

    // Create a file with TypeScript errors
    await writeFile(
      "src/main.ts",
      `// File with TypeScript errors
let x: string = 123; // Type error
function test(): number {
  return "hello"; // Type error
}

// Unused variable
const unused = "unused";

console.log(x);
`,
    );

    // Create a file without errors
    await writeFile(
      "src/clean.ts",
      `// Clean TypeScript file
export function add(a: number, b: number): number {
  return a + b;
}

export const message = "Hello, World!";
`,
    );

    // Create test files
    await writeFile(
      "src/clean.test.ts",
      `import { add } from "./clean";

test("add function", () => {
  expect(add(2, 3)).toBe(5);
});
`,
    );
  });

  afterAll(async () => {
    process.chdir(originalCwd);
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  test("should detect project type", async () => {
    const result = await examination.execute({});

    expect(result).toContain("Project types detected:");
    expect(result).toContain("nodejs");
    expect(result).toContain("typescript");
  });

  test("should return project-wide summary when no path provided", async () => {
    const result = await examination.execute({});

    expect(typeof result).toBe("string");
    expect(result).toContain("Project types detected:");
    // The result should either show diagnostics or indicate no issues found
    expect(
      result.includes("Project diagnostic summary:") ||
        result.includes("No errors or warnings found"),
    ).toBe(true);
  });

  test("should handle specific file path", async () => {
    const result = await examination.execute({ path: "src/clean.ts" });

    expect(typeof result).toBe("string");
    // Should either show specific diagnostics or indicate no issues
    expect(
      result.includes("Found") ||
        result.includes("File doesn't have errors or warnings") ||
        result.includes("No errors or warnings found"),
    ).toBe(true);
  });

  test("should handle non-existent file path", async () => {
    const result = await examination.execute({
      path: "src/nonexistent.ts",
    });

    expect(result).toContain("Could not find path");
    expect(result).toContain("src/nonexistent.ts");
  });

  test("should handle empty path parameter", async () => {
    const result = await examination.execute({ path: "" });

    expect(typeof result).toBe("string");
    expect(result).toContain("Project types detected:");
  });

  test("should handle projects without TypeScript", async () => {
    // Temporarily rename tsconfig.json to simulate non-TypeScript project
    const tsConfigPath = "tsconfig.json";
    const tempTsConfigPath = "tsconfig.json.bak";

    try {
      await writeFile(tempTsConfigPath, await Bun.file(tsConfigPath).text());
      await rm(tsConfigPath);

      const result = await examination.execute({});

      expect(typeof result).toBe("string");
      expect(result).toContain("Project types detected:");
      expect(result).toContain("nodejs");
    } finally {
      // Restore tsconfig.json
      if (existsSync(tempTsConfigPath)) {
        await writeFile(tsConfigPath, await Bun.file(tempTsConfigPath).text());
        await rm(tempTsConfigPath);
      }
    }
  });

  test("should handle errors gracefully", async () => {
    // Create a scenario that might cause errors
    const result = await examination.execute({
      path: "src/../package.json",
    });

    expect(typeof result).toBe("string");
    // Should not throw an error, but may return diagnostic info or error message
  });
});
