import { tool } from "ai";
import z from "zod";
import { readFile } from "node:fs/promises";
import { resolve, join, relative, isAbsolute } from "node:path";
import { existsSync } from "node:fs";

interface DiagnosticEntry {
  file: string;
  line: number;
  column: number;
  severity: "error" | "warning" | "info";
  message: string;
  rule?: string;
  source?: string;
}

interface DiagnosticSummary {
  file: string;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

interface ExecutedCheck {
  name: string;
  executed: boolean;
  reason?: string;
}

interface ProjectDiagnostics {
  totalErrors: number;
  totalWarnings: number;
  totalInfo: number;
  files: DiagnosticSummary[];
  details?: DiagnosticEntry[];
  executedChecks: ExecutedCheck[];
}

interface DetectedProject {
  types: string[];
  tools: {
    biome: boolean;
    eslint: boolean;
    prettier: boolean;
    typescript: boolean;
  };
}

/**
 * Detects if project has TypeScript/JavaScript setup and available tools
 */
async function detectProjectType(
  projectRoot: string,
): Promise<DetectedProject> {
  const types: string[] = [];
  const tools = {
    biome: false,
    eslint: false,
    prettier: false,
    typescript: false,
  };

  // Check for package.json (Node.js/JavaScript/TypeScript)
  if (existsSync(join(projectRoot, "package.json"))) {
    types.push("nodejs");

    try {
      const pkg = JSON.parse(
        await readFile(join(projectRoot, "package.json"), "utf-8"),
      );

      // Check for TypeScript
      if (pkg.devDependencies?.typescript || pkg.dependencies?.typescript) {
        types.push("typescript");
        tools.typescript = true;
      }

      // Check for Biome
      if (
        pkg.devDependencies?.["@biomejs/biome"] ||
        pkg.dependencies?.["@biomejs/biome"]
      ) {
        tools.biome = true;
      }

      // Check for ESLint
      if (pkg.devDependencies?.eslint || pkg.dependencies?.eslint) {
        tools.eslint = true;
      }

      // Check for Prettier
      if (pkg.devDependencies?.prettier || pkg.dependencies?.prettier) {
        tools.prettier = true;
      }
    } catch {}
  }

  // Check for TypeScript config
  if (existsSync(join(projectRoot, "tsconfig.json"))) {
    if (!types.includes("typescript")) {
      types.push("typescript");
    }
    tools.typescript = true;
  }

  // Check for Biome config
  if (
    existsSync(join(projectRoot, "biome.json")) ||
    existsSync(join(projectRoot, "biome.jsonc"))
  ) {
    tools.biome = true;
  }

  // Check for ESLint config
  const eslintConfigs = [
    ".eslintrc.js",
    ".eslintrc.json",
    ".eslintrc.yml",
    ".eslintrc.yaml",
    "eslint.config.js",
  ];
  if (eslintConfigs.some((config) => existsSync(join(projectRoot, config)))) {
    tools.eslint = true;
  }

  // Check for Prettier config
  const prettierConfigs = [
    ".prettierrc",
    ".prettierrc.json",
    ".prettierrc.yml",
    ".prettierrc.yaml",
    "prettier.config.js",
  ];
  if (prettierConfigs.some((config) => existsSync(join(projectRoot, config)))) {
    tools.prettier = true;
  }

  return { types: types.length > 0 ? types : ["unknown"], tools };
}

/**
 * Runs TypeScript compiler diagnostics using Bun
 */
async function getTypeScriptDiagnostics(
  projectRoot: string,
  filePath?: string,
): Promise<DiagnosticEntry[]> {
  const diagnostics: DiagnosticEntry[] = [];

  try {
    const args = ["npx", "tsc", "--noEmit", "--pretty", "false"];
    if (filePath) {
      args.push(filePath);
    }

    const proc = Bun.spawn(args, {
      cwd: projectRoot,
      stderr: "pipe",
      stdout: "pipe",
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);

    await proc.exited;

    const output = stdout + stderr;
    const lines = output.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      // Parse TypeScript error format: file(line,column): error TS#### message
      const match = line.match(
        /^(.+?)\((\d+),(\d+)\):\s+(error|warning|info)\s+TS\d+:\s+(.+)$/,
      );
      if (match) {
        const [, file, lineStr, columnStr, severity, message] = match;
        // Handle both absolute and relative file paths
        const normalizedFile = isAbsolute(file)
          ? relative(projectRoot, file)
          : file;
        diagnostics.push({
          file: normalizedFile,
          line: parseInt(lineStr),
          column: parseInt(columnStr),
          severity: severity as "error" | "warning" | "info",
          message: message.trim(),
          source: "typescript",
        });
      }
    }
  } catch (error) {
    // TypeScript might not be available
    console.error("TypeScript check failed:", error);
  }

  return diagnostics;
}

/**
 * Runs ESLint diagnostics using Bun
 */
async function getESLintDiagnostics(
  projectRoot: string,
  filePath?: string,
): Promise<DiagnosticEntry[]> {
  const diagnostics: DiagnosticEntry[] = [];

  try {
    const target = filePath || ".";
    const args = ["npx", "eslint", "--format", "json", target];

    const proc = Bun.spawn(args, {
      cwd: projectRoot,
      stderr: "pipe",
      stdout: "pipe",
    });

    const stdout = await new Response(proc.stdout).text();
    await proc.exited;

    if (stdout.trim()) {
      const results = JSON.parse(stdout);

      for (const result of results) {
        const filePath = relative(projectRoot, result.filePath);

        for (const message of result.messages) {
          diagnostics.push({
            file: filePath,
            line: message.line || 1,
            column: message.column || 1,
            severity: message.severity === 2 ? "error" : "warning",
            message: message.message,
            rule: message.ruleId,
            source: "eslint",
          });
        }
      }
    }
  } catch (error) {
    // ESLint might not be configured or installed
    console.error("ESLint check failed:", error);
  }

  return diagnostics;
}

/**
 * Runs Prettier check using Bun
 */
async function getPrettierDiagnostics(
  projectRoot: string,
  filePath?: string,
): Promise<DiagnosticEntry[]> {
  const diagnostics: DiagnosticEntry[] = [];

  try {
    const target = filePath || "**/*.{js,jsx,ts,tsx,json,md}";
    const args = ["npx", "prettier", "--check", target];

    const proc = Bun.spawn(args, {
      cwd: projectRoot,
      stderr: "pipe",
      stdout: "pipe",
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const output = stdout + stderr;
      const lines = output.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        // Prettier outputs unformatted files
        if (
          line &&
          !line.includes("Checking formatting") &&
          !line.includes("Code style issues")
        ) {
          const filePath = line.trim();
          if (filePath && existsSync(join(projectRoot, filePath))) {
            diagnostics.push({
              file: filePath,
              line: 1,
              column: 1,
              severity: "warning",
              message: "File is not formatted according to Prettier rules",
              source: "prettier",
            });
          }
        }
      }
    }
  } catch (error) {
    // Prettier might not be configured or installed
    console.error("Prettier check failed:", error);
  }

  return diagnostics;
}

/**
 * Runs Biome diagnostics using Bun
 */
async function getBiomeDiagnostics(
  projectRoot: string,
  filePath?: string,
): Promise<DiagnosticEntry[]> {
  const diagnostics: DiagnosticEntry[] = [];

  try {
    const target = filePath || ".";
    const args = ["npx", "@biomejs/biome", "check", "--reporter=json", target];

    const proc = Bun.spawn(args, {
      cwd: projectRoot,
      stderr: "pipe",
      stdout: "pipe",
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);

    const exitCode = await proc.exited;

    if (stdout.trim()) {
      try {
        const results = JSON.parse(stdout);

        if (results.diagnostics && Array.isArray(results.diagnostics)) {
          for (const diagnostic of results.diagnostics) {
            const filePath = diagnostic.location?.path
              ? relative(projectRoot, diagnostic.location.path)
              : "unknown";

            diagnostics.push({
              file: filePath,
              line: diagnostic.location?.span?.start?.line || 1,
              column: diagnostic.location?.span?.start?.column || 1,
              severity: diagnostic.severity === "error" ? "error" : "warning",
              message:
                diagnostic.description ||
                diagnostic.message ||
                "Biome diagnostic",
              rule: diagnostic.category,
              source: "biome",
            });
          }
        }
      } catch (parseError) {
        // If JSON parsing fails, try to parse stderr for simple errors
        const output = stderr;
        const lines = output.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.includes("error") || line.includes("warning")) {
            diagnostics.push({
              file: filePath ? relative(projectRoot, filePath) : "project",
              line: 1,
              column: 1,
              severity: line.includes("error") ? "error" : "warning",
              message: line.trim(),
              source: "biome",
            });
          }
        }
      }
    }
  } catch (error) {
    // Biome might not be available
    console.error("Biome check failed:", error);
  }

  return diagnostics;
}

/**
 * Runs unit tests using project's test script
 */
async function getUnitTestDiagnostics(
  projectRoot: string,
): Promise<DiagnosticEntry[]> {
  const diagnostics: DiagnosticEntry[] = [];

  try {
    // Check if package.json exists and has test script
    const packageJsonPath = join(projectRoot, "package.json");
    if (!existsSync(packageJsonPath)) {
      return diagnostics;
    }

    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));

    const testScript = packageJson.scripts?.test;
    if (
      !testScript ||
      testScript === 'echo "Error: no test specified" && exit 1'
    ) {
      return diagnostics;
    }

    // Run the test script
    const args = ["npm", "run", "test"];

    const proc = Bun.spawn(args, {
      cwd: projectRoot,
      stderr: "pipe",
      stdout: "pipe",
      env: { ...process.env, CI: "true" }, // Set CI env to avoid interactive prompts
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const output = stdout + stderr;
      const lines = output.split("\n");

      // Parse test failures for common test runners
      let currentFile = "";
      let testFailures = 0;

      for (const line of lines) {
        // Jest/Vitest failure patterns
        const jestFailMatch = line.match(/^\s*●\s*(.*?)(?:\s*›\s*(.*))?$/);
        const vitestFailMatch = line.match(/^\s*×\s*(.*?)(?:\s*>\s*(.*))?$/);
        const bunTestFailMatch = line.match(/^✗\s*(.*?)\s*\[/);

        // File path detection
        const fileMatch = line.match(/^\s*(.+\.(?:test|spec)\.[jt]sx?):/);
        if (fileMatch) {
          currentFile = relative(projectRoot, fileMatch[1]);
        }

        if (jestFailMatch || vitestFailMatch || bunTestFailMatch) {
          testFailures++;
          const testName =
            jestFailMatch?.[1] ||
            vitestFailMatch?.[1] ||
            bunTestFailMatch?.[1] ||
            "Unknown test";

          diagnostics.push({
            file: currentFile || "test suite",
            line: 1,
            column: 1,
            severity: "error",
            message: `Test failed: ${testName.trim()}`,
            source: "tests",
          });
        }

        // Generic error patterns if specific patterns don't match
        if (
          !jestFailMatch &&
          !vitestFailMatch &&
          !bunTestFailMatch &&
          (line.includes("FAIL") ||
            line.includes("✗") ||
            line.includes("failed"))
        ) {
          const trimmedLine = line.trim();
          if (
            trimmedLine &&
            !trimmedLine.includes("Tests:") &&
            !trimmedLine.includes("Suites:")
          ) {
            diagnostics.push({
              file: currentFile || "test suite",
              line: 1,
              column: 1,
              severity: "error",
              message: `Test failure: ${trimmedLine}`,
              source: "tests",
            });
          }
        }
      }

      // If no specific failures found but tests failed, add generic failure
      if (diagnostics.length === 0) {
        diagnostics.push({
          file: "test suite",
          line: 1,
          column: 1,
          severity: "error",
          message: "Unit tests failed - check test output for details",
          source: "tests",
        });
      }
    }
  } catch (error) {
    // Test execution might fail for various reasons
    console.error("Unit test execution failed:", error);
  }

  return diagnostics;
}

/**
 * Aggregates diagnostics into summary format
 */
function aggregateDiagnostics(
  diagnostics: DiagnosticEntry[],
  executedChecks: ExecutedCheck[] = [],
): ProjectDiagnostics {
  const fileMap = new Map<string, DiagnosticSummary>();
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalInfo = 0;

  for (const diagnostic of diagnostics) {
    if (!fileMap.has(diagnostic.file)) {
      fileMap.set(diagnostic.file, {
        file: diagnostic.file,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
      });
    }

    const summary = fileMap.get(diagnostic.file)!;

    switch (diagnostic.severity) {
      case "error":
        summary.errorCount++;
        totalErrors++;
        break;
      case "warning":
        summary.warningCount++;
        totalWarnings++;
        break;
      case "info":
        summary.infoCount++;
        totalInfo++;
        break;
    }
  }

  return {
    totalErrors,
    totalWarnings,
    totalInfo,
    files: Array.from(fileMap.values()),
    details: diagnostics,
    executedChecks,
  };
}

/**
 * Formats diagnostic output for display
 */
function formatDiagnostics(
  diagnostics: ProjectDiagnostics,
  showDetails: boolean = false,
): string {
  let output = "";

  // Show executed checks information
  if (diagnostics.executedChecks.length > 0) {
    output += "Executed checks:\n";
    for (const check of diagnostics.executedChecks) {
      const status = check.executed ? "✅" : "⏭️";
      output += `  ${status} ${check.name}`;
      if (!check.executed && check.reason) {
        output += ` (${check.reason})`;
      } else if (check.executed) {
        const checkDiagnostics =
          diagnostics.details?.filter(
            (d) => d.source === check.name.toLowerCase(),
          ) || [];
        const errors = checkDiagnostics.filter(
          (d) => d.severity === "error",
        ).length;
        const warnings = checkDiagnostics.filter(
          (d) => d.severity === "warning",
        ).length;
        if (errors > 0 || warnings > 0) {
          output += ` - found ${errors} error(s), ${warnings} warning(s)`;
        } else {
          output += ` - no issues found`;
        }
      }
      output += "\n";
    }
    output += "\n";
  }

  if (diagnostics.totalErrors === 0 && diagnostics.totalWarnings === 0) {
    output += "No errors or warnings found in the project.";
    return output;
  }

  if (showDetails && diagnostics.details) {
    // Show detailed diagnostics for specific file
    output += `Found ${diagnostics.totalErrors} error(s) and ${diagnostics.totalWarnings} warning(s):\n\n`;

    // Group diagnostics by source
    const diagnosticsBySource = new Map<string, DiagnosticEntry[]>();
    for (const diagnostic of diagnostics.details) {
      const source = diagnostic.source || "unknown";
      if (!diagnosticsBySource.has(source)) {
        diagnosticsBySource.set(source, []);
      }
      diagnosticsBySource.get(source)!.push(diagnostic);
    }

    for (const [source, sourceDiagnostics] of diagnosticsBySource) {
      if (sourceDiagnostics.length > 0) {
        output += `--- ${source.toUpperCase()} ---\n`;
        for (const diagnostic of sourceDiagnostics) {
          const icon = diagnostic.severity === "error" ? "❌" : "⚠️";
          output += `${icon} ${diagnostic.severity} at line ${diagnostic.line}:${diagnostic.column}: ${diagnostic.message}`;
          if (diagnostic.rule) {
            output += ` (${diagnostic.rule})`;
          }
          output += "\n";
        }
        output += "\n";
      }
    }
  } else {
    // Show summary for project-wide diagnostics
    output += `Project diagnostic summary:\n`;
    output += `Total: ${diagnostics.totalErrors} error(s), ${diagnostics.totalWarnings} warning(s)\n\n`;

    if (diagnostics.files.length > 0) {
      output += "Files with issues:\n";
      for (const file of diagnostics.files) {
        if (file.errorCount > 0 || file.warningCount > 0) {
          output += `  ${file.file}: ${file.errorCount} error(s), ${file.warningCount} warning(s)\n`;
        }
      }
    }
  }

  return output;
}

export const examination = tool({
  description: `Get errors and warnings for JavaScript/TypeScript projects or specific files.

This tool can be invoked after a series of edits to determine if further edits are necessary, or if the user asks to fix errors or warnings in their codebase.

When a path is provided, shows all diagnostics for that specific file.
When no path is provided, shows a summary of error and warning counts for all files in the project.

Supports TypeScript compiler, ESLint, Prettier, Biome, and unit test execution for JavaScript/TypeScript projects.

<example>
To get diagnostics for a specific file:
{
    "path": "src/main.ts"
}

To get a project-wide diagnostic summary:
{}
</example>

<guidelines>
- If you think you can fix a diagnostic, make 1-2 attempts and then give up.
- Don't remove code you've generated just because you can't fix an error. The user can help you fix it.
</guidelines>`,

  parameters: z.object({
    path: z
      .string()
      .optional()
      .describe(
        "The path to get diagnostics for. If not provided, returns a project-wide summary. " +
          "This path should never be absolute, and the first component of the path should always be a root directory in a project. " +
          "Example: If the project has root directories 'src' and 'tests', you can access diagnostics for 'main.ts' in 'src' using 'src/main.ts'.",
      ),
  }),

  execute: async ({ path }) => {
    try {
      const projectRoot = process.cwd();

      // Detect project type and available tools
      const detected = await detectProjectType(projectRoot);

      if (
        !detected.types.includes("nodejs") &&
        !detected.types.includes("typescript")
      ) {
        return "This project doesn't appear to be a JavaScript or TypeScript project. No package.json or tsconfig.json found.";
      }

      let allDiagnostics: DiagnosticEntry[] = [];
      const executedChecks: ExecutedCheck[] = [];

      // Resolve full path if specified
      let targetPath: string | undefined;
      if (path && path.trim()) {
        targetPath = resolve(projectRoot, path);

        // Check if file exists
        if (!existsSync(targetPath)) {
          return `Error: Could not find path "${path}" in project.`;
        }
      }

      // Run diagnostics based on available tools
      const diagnosticPromises: Promise<DiagnosticEntry[]>[] = [];

      // Biome diagnostics (if available)
      if (detected.tools.biome) {
        diagnosticPromises.push(getBiomeDiagnostics(projectRoot, targetPath));
        executedChecks.push({
          name: "Biome",
          executed: true,
        });
      } else {
        executedChecks.push({
          name: "Biome",
          executed: false,
          reason: "not installed or configured",
        });
      }

      // TypeScript diagnostics
      if (detected.tools.typescript) {
        diagnosticPromises.push(
          getTypeScriptDiagnostics(projectRoot, targetPath),
        );
        executedChecks.push({
          name: "TypeScript",
          executed: true,
        });
      } else {
        executedChecks.push({
          name: "TypeScript",
          executed: false,
          reason: "not installed or configured",
        });
      }

      // ESLint diagnostics (only for project-wide or if targeting JS/TS files)
      if (
        detected.tools.eslint &&
        (!targetPath || targetPath.match(/\.(js|jsx|ts|tsx)$/))
      ) {
        diagnosticPromises.push(getESLintDiagnostics(projectRoot, targetPath));
        executedChecks.push({
          name: "ESLint",
          executed: true,
        });
      } else if (detected.tools.eslint) {
        executedChecks.push({
          name: "ESLint",
          executed: false,
          reason: "file type not supported",
        });
      } else {
        executedChecks.push({
          name: "ESLint",
          executed: false,
          reason: "not installed or configured",
        });
      }

      // Prettier diagnostics (only for project-wide scans to avoid noise)
      if (detected.tools.prettier && !targetPath) {
        diagnosticPromises.push(getPrettierDiagnostics(projectRoot));
        executedChecks.push({
          name: "Prettier",
          executed: true,
        });
      } else if (detected.tools.prettier) {
        executedChecks.push({
          name: "Prettier",
          executed: false,
          reason: "skipped for single file analysis",
        });
      } else {
        executedChecks.push({
          name: "Prettier",
          executed: false,
          reason: "not installed or configured",
        });
      }

      // Unit test diagnostics (only for project-wide scans)
      if (!targetPath) {
        diagnosticPromises.push(getUnitTestDiagnostics(projectRoot));
        executedChecks.push({
          name: "Tests",
          executed: true,
        });
      } else {
        executedChecks.push({
          name: "Tests",
          executed: false,
          reason: "skipped for single file analysis",
        });
      }

      // Wait for all diagnostics to complete
      const diagnosticResults = await Promise.all(diagnosticPromises);
      allDiagnostics = diagnosticResults.flat();

      // Filter diagnostics for specific file if path provided
      if (targetPath) {
        const relativePath = relative(projectRoot, targetPath);
        allDiagnostics = allDiagnostics.filter((d) => d.file === relativePath);
      }

      // Aggregate and format results
      const diagnostics = aggregateDiagnostics(allDiagnostics, executedChecks);
      const showDetails = !!targetPath;

      let result = formatDiagnostics(diagnostics, showDetails);

      // Add project type information
      if (!targetPath) {
        result = `Project types detected: ${detected.types.join(", ")}\n\n${result}`;
      }

      return result;
    } catch (error) {
      return `Error running diagnostics: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
