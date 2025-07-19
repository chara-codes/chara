import { tool } from "ai";
import z from "zod";
import { readFile } from "node:fs/promises";
import { globby } from "globby";
import { resolve, relative } from "node:path";

interface GrepMatch {
  file: string;
  line: string;
  line_num?: number;
  matches: Array<{ start: number; end: number }>;
}

interface GrepResult {
  match?: GrepMatch;
  before_context?: GrepMatch[];
  after_context?: GrepMatch[];
}

interface GrepError {
  error: string;
  code?: string;
}

interface GrepOptions {
  pattern: string;
  ignoreCase?: boolean;
  fixedStrings?: boolean;
  invertMatch?: boolean;
  lineNumber?: boolean;
  beforeContext?: number;
  afterContext?: number;
  context?: number;
  maxCount?: number;
}

function createPattern(options: GrepOptions): RegExp | GrepError {
  const { pattern, ignoreCase = false, fixedStrings = false } = options;

  if (fixedStrings) {
    // For fixed strings, escape regex special characters
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const flags = ignoreCase ? "gi" : "g";
    try {
      return new RegExp(escapedPattern, flags);
    } catch {
      return { error: `Invalid escaped pattern: ${pattern}` };
    }
  } else {
    // For regex patterns
    const flags = ignoreCase ? "gi" : "g";
    try {
      return new RegExp(pattern, flags);
    } catch {
      return { error: `Invalid regular expression: ${pattern}` };
    }
  }
}

function matchesPattern(
  line: string,
  pattern: RegExp,
  invertMatch = false
): boolean {
  const matches = pattern.test(line);
  // Reset regex lastIndex to avoid stateful issues
  pattern.lastIndex = 0;
  return matches !== invertMatch;
}

function getMatches(
  line: string,
  pattern: RegExp,
  invertMatch = false
): Array<{ start: number; end: number }> {
  if (invertMatch) {
    return [];
  }

  const matches: Array<{ start: number; end: number }> = [];
  let match: RegExpExecArray | null;

  // Reset regex to start from beginning
  pattern.lastIndex = 0;

  // biome-ignore lint/suspicious/noAssignInExpressions: necessary for regex matching loop
  while ((match = pattern.exec(line)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length });

    // Prevent infinite loop on zero-length matches
    if (match[0].length === 0) {
      pattern.lastIndex++;
    }

    // For global flag, continue until no more matches
    if (!pattern.global) {
      break;
    }
  }

  // Reset regex lastIndex
  pattern.lastIndex = 0;
  return matches;
}

function makeRelativePath(filePath: string): string {
  const cwd = process.cwd();
  if (filePath.startsWith(cwd)) {
    return relative(cwd, filePath);
  }
  return filePath;
}

async function searchFile(
  filePath: string,
  options: GrepOptions
): Promise<GrepResult[] | GrepError> {
  const {
    lineNumber = true,
    beforeContext = 0,
    afterContext = 0,
    context,
    maxCount = 0,
    invertMatch = false,
  } = options;

  const actualBeforeContext = context !== undefined ? context : beforeContext;
  const actualAfterContext = context !== undefined ? context : afterContext;

  const patternResult = createPattern(options);
  if ("error" in patternResult) {
    return patternResult;
  }
  const pattern = patternResult;

  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n");

    const results: GrepResult[] = [];
    let matchCount = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      if (line === undefined) continue;

      const lineNum = lineIdx + 1;

      if (matchesPattern(line, pattern, invertMatch)) {
        const matches = getMatches(line, pattern, invertMatch);

        if (actualBeforeContext > 0 || actualAfterContext > 0) {
          // Build result with context
          const result: GrepResult = {
            match: {
              file: filePath,
              line,
              matches,
            },
            before_context: [],
            after_context: [],
          };

          if (lineNumber && result.match) {
            result.match.line_num = lineNum;
          }

          // Add before context
          const beforeStart = Math.max(0, lineIdx - actualBeforeContext);
          for (let i = beforeStart; i < lineIdx; i++) {
            const contextLine = lines[i];
            if (contextLine === undefined) continue;

            const contextMatch: GrepMatch = {
              file: filePath,
              line: contextLine,
              matches: [],
            };
            if (lineNumber) {
              contextMatch.line_num = i + 1;
            }
            if (result.before_context) {
              result.before_context.push(contextMatch);
            }
          }

          // Add after context
          const afterEnd = Math.min(
            lines.length,
            lineIdx + actualAfterContext + 1
          );
          for (let i = lineIdx + 1; i < afterEnd; i++) {
            const contextLine = lines[i];
            if (contextLine === undefined) continue;

            const contextMatch: GrepMatch = {
              file: filePath,
              line: contextLine,
              matches: [],
            };
            if (lineNumber) {
              contextMatch.line_num = i + 1;
            }
            if (result.after_context) {
              result.after_context.push(contextMatch);
            }
          }

          results.push(result);
        } else {
          // Simple match without context
          const match: GrepMatch = {
            file: filePath,
            line,
            matches,
          };

          if (lineNumber) {
            match.line_num = lineNum;
          }

          results.push({ match });
        }

        matchCount++;
        if (maxCount > 0 && matchCount >= maxCount) {
          break;
        }
      }
    }

    return results;
  } catch (error) {
    return {
      error: `Error reading file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

async function searchFiles(
  paths: string[],
  options: GrepOptions,
  filePattern?: string,
  useGitignore = true,
  caseSensitiveFilePattern = true
): Promise<GrepResult[] | GrepError> {
  const results: GrepResult[] = [];
  let totalMatches = 0;
  const { maxCount = 0 } = options;

  try {
    // Group paths by their base directory to handle absolute paths properly
    const pathGroups = new Map<string, string[]>();

    for (const path of paths) {
      const resolvedPath = resolve(path);

      // Check if it's already a glob pattern
      if (path.includes("*") || path.includes("?") || path.includes("[")) {
        // For glob patterns, use current directory as base
        const basePath = process.cwd();
        if (!pathGroups.has(basePath)) {
          pathGroups.set(basePath, []);
        }
        const group = pathGroups.get(basePath);
        if (group) {
          group.push(path);
        }
      } else {
        // Determine base directory for the path
        let basePath: string;
        let relativePath: string;

        try {
          const fs = await import("node:fs/promises");
          const stats = await fs.stat(resolvedPath);
          if (stats.isDirectory()) {
            basePath = resolvedPath;
            relativePath = "**/*";
          } else {
            basePath = resolve(resolvedPath, "..");
            relativePath = relative(basePath, resolvedPath);
          }
        } catch {
          // If stat fails, assume it's a file path
          basePath = resolve(path, "..");
          relativePath = relative(basePath, resolve(path));
        }

        if (!pathGroups.has(basePath)) {
          pathGroups.set(basePath, []);
        }
        const group = pathGroups.get(basePath);
        if (group) {
          group.push(relativePath);
        }
      }
    }

    // Process each group with its own cwd
    for (const [basePath, groupPaths] of pathGroups) {
      const negativePatterns: string[] = [];

      // Always ignore these directories
      negativePatterns.push(
        "!**/.chara/**",
        "!**/.git/**",
        "!**/node_modules/**",
        "!**/.turbo/**",
        "!**/.cache/**",
        "!**/dist/**",
        "!**/build/**",
        "!**/.next/**",
        "!**/.nuxt/**",
        "!**/coverage/**",
        "!**/.nyc_output/**",
        "!**/tmp/**",
        "!**/temp/**"
      );

      // Apply file pattern filter if specified
      let finalPatterns = groupPaths;
      if (filePattern) {
        finalPatterns = groupPaths.map((pattern) => {
          if (pattern.includes("**/*")) {
            return pattern.replace("**/*", `**/${filePattern}`);
          } else if (pattern === "**/*") {
            return `**/${filePattern}`;
          }
          // If it's a specific file pattern, we need to match against it
          return pattern;
        });

        // If case insensitive, add both upper and lower case variants
        if (!caseSensitiveFilePattern) {
          const caseVariants: string[] = [];
          for (const pattern of finalPatterns) {
            if (pattern.includes(filePattern)) {
              // Create case-insensitive variants
              const lowerPattern = pattern.replace(
                filePattern,
                filePattern.toLowerCase()
              );
              const upperPattern = pattern.replace(
                filePattern,
                filePattern.toUpperCase()
              );
              const titlePattern = pattern.replace(
                filePattern,
                filePattern.charAt(0).toUpperCase() +
                  filePattern.slice(1).toLowerCase()
              );

              caseVariants.push(lowerPattern, upperPattern, titlePattern);
            }
          }
          finalPatterns = [...finalPatterns, ...caseVariants];
        }
      }

      try {
        // Use globby to find files with the appropriate cwd
        const files = await globby([...finalPatterns, ...negativePatterns], {
          gitignore: useGitignore,
          onlyFiles: true,
          absolute: true,
          dot: false,
          followSymbolicLinks: false,
          cwd: basePath,
          ignore: [],
        });

        // Search each file
        for (const file of files) {
          const fileResults = await searchFile(file, options);
          if ("error" in fileResults) {
            // Skip files that can't be read (binary files, permission issues, etc.)
            continue;
          }

          for (const result of fileResults) {
            // Convert absolute path back to relative for display if it's within original cwd
            if (result.match) {
              result.match.file = makeRelativePath(result.match.file);
            }
            if (result.before_context) {
              result.before_context.forEach((ctx) => {
                ctx.file = makeRelativePath(ctx.file);
              });
            }
            if (result.after_context) {
              result.after_context.forEach((ctx) => {
                ctx.file = makeRelativePath(ctx.file);
              });
            }
            results.push(result);
            totalMatches++;
            if (maxCount > 0 && totalMatches >= maxCount) {
              return results;
            }
          }
        }
      } catch {
        // If globby fails for this group, skip it
        continue;
      }
    }
  } catch (error) {
    return {
      error: `Error searching files: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  return results;
}

export const grep = tool({
  description:
    "Search for patterns in files using grep-like functionality with globby for file matching. Automatically respects .gitignore files and ignores common build/cache directories (.chara/, .git/, node_modules/, etc.). Supports regex patterns, context lines, and various filtering options.",
  parameters: z.object({
    pattern: z
      .string()
      .describe("Pattern to search for (supports regular expressions)"),
    paths: z
      .union([z.string(), z.array(z.string())])
      .describe(
        "File paths, directory paths, or glob patterns to search in (string or array of strings). Examples: 'src/', '**/*.ts', ['src/', 'tests/']"
      ),
    ignoreCase: z
      .boolean()
      .default(false)
      .describe("Case-insensitive matching"),
    beforeContext: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Number of lines before match to show"),
    afterContext: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Number of lines after match to show"),
    context: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe(
        "Number of context lines around match (overrides before/after)"
      ),
    maxCount: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Stop after N matches (0 = no limit)"),
    fixedStrings: z
      .boolean()
      .default(false)
      .describe("Treat pattern as literal text, not regex"),
    invertMatch: z
      .boolean()
      .default(false)
      .describe("Select non-matching lines"),
    lineNumber: z.boolean().default(true).describe("Show line numbers"),
    filePattern: z
      .string()
      .optional()
      .describe("Glob pattern to filter files (e.g., '*.txt', '*.{js,ts}')"),
    useGitignore: z
      .boolean()
      .default(true)
      .describe("Respect .gitignore files when searching"),
    fallbackToCurrentDir: z
      .boolean()
      .default(true)
      .describe(
        "If no matches found in specified directories, search from current directory"
      ),
  }),
  execute: async ({
    pattern,
    paths,
    ignoreCase = false,
    beforeContext = 0,
    afterContext = 0,
    context,
    maxCount = 0,
    fixedStrings = false,
    invertMatch = false,
    lineNumber = true,
    filePattern,
    useGitignore = true,
    fallbackToCurrentDir = true,
  }) => {
    // Validate pattern early to catch invalid regex
    const patternValidation = createPattern({
      pattern,
      ignoreCase,
      fixedStrings,
    });

    if ("error" in patternValidation) {
      return JSON.stringify({ error: patternValidation.error }, null, 2);
    }

    // Convert single path to array
    const pathArray = Array.isArray(paths) ? paths : [paths];

    // Create grep options
    const options: GrepOptions = {
      pattern,
      ignoreCase,
      fixedStrings,
      invertMatch,
      lineNumber,
      beforeContext,
      afterContext,
      context,
      maxCount,
    };

    try {
      // Search files using globby
      let results = await searchFiles(
        pathArray,
        options,
        filePattern,
        useGitignore,
        !ignoreCase // Use case-insensitive file patterns when ignoreCase is true
      );

      if ("error" in results) {
        return JSON.stringify({ error: results.error }, null, 2);
      }

      // If no matches found and we searched in specific directories, try searching from current directory
      if (
        results.length === 0 &&
        fallbackToCurrentDir &&
        pathArray.length > 0
      ) {
        const hasSpecificDirectories = pathArray.some((path) => {
          // Check if path is a directory (not a glob pattern and not current directory)
          // Also exclude temporary directories (test scenarios)
          const isGlobPattern =
            path.includes("*") || path.includes("?") || path.includes("[");
          const isCurrentDir = path === "." || path === "./";
          const isTempDir =
            path.includes("/tmp/") ||
            path.includes("\\tmp\\") ||
            path.startsWith("/var/folders/") ||
            path.startsWith("C:\\Users\\") ||
            path.includes("bun-test-");

          return !isGlobPattern && !isCurrentDir && !isTempDir;
        });

        if (hasSpecificDirectories) {
          const fallbackResults = await searchFiles(
            ["."],
            options,
            filePattern,
            useGitignore,
            !ignoreCase
          );

          if ("error" in fallbackResults) {
            return JSON.stringify({ error: fallbackResults.error }, null, 2);
          }

          results = fallbackResults;
        }
      }

      if (results.length === 0) {
        return "No matches found";
      }

      // Format results
      const formattedResults = results.map((result) => {
        if (
          (result.before_context && result.before_context.length > 0) ||
          (result.after_context && result.after_context.length > 0)
        ) {
          // Result with context
          return {
            match: result.match,
            before_context: result.before_context,
            after_context: result.after_context,
          };
        }
        // Simple match
        return result.match;
      });

      // Limit results to prevent overwhelming output
      const MAX_RESULTS = 50;
      if (formattedResults.length > MAX_RESULTS) {
        const truncatedResults = formattedResults.slice(0, MAX_RESULTS);
        return `Found ${
          results.length
        } matches, showing first ${MAX_RESULTS}:\n\n${JSON.stringify(
          truncatedResults,
          null,
          2
        )}`;
      }

      return JSON.stringify(formattedResults, null, 2);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return JSON.stringify(
        { error: `Grep search failed: ${errorMessage}` },
        null,
        2
      );
    }
  },
});
