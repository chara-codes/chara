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

function createPattern(options: GrepOptions): RegExp {
  const { pattern, ignoreCase = false, fixedStrings = false } = options;

  if (fixedStrings) {
    // For fixed strings, escape regex special characters
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const flags = ignoreCase ? "gi" : "g";
    return new RegExp(escapedPattern, flags);
  } else {
    // For regex patterns
    const flags = ignoreCase ? "gi" : "g";
    try {
      return new RegExp(pattern, flags);
    } catch {
      throw new Error(`Invalid regular expression: ${pattern}`);
    }
  }
}

function matchesPattern(
  line: string,
  pattern: RegExp,
  invertMatch = false,
): boolean {
  const matches = pattern.test(line);
  // Reset regex lastIndex to avoid stateful issues
  pattern.lastIndex = 0;
  return matches !== invertMatch;
}

function getMatches(
  line: string,
  pattern: RegExp,
  invertMatch = false,
): Array<{ start: number; end: number }> {
  if (invertMatch) {
    return [];
  }

  const matches: Array<{ start: number; end: number }> = [];
  let match: RegExpExecArray | null;

  // Reset regex to start from beginning
  pattern.lastIndex = 0;

  // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
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
  options: GrepOptions,
): Promise<GrepResult[]> {
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

  const pattern = createPattern(options);

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
            lineIdx + actualAfterContext + 1,
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
    throw new Error(
      `Error reading file ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function searchFiles(
  paths: string[],
  options: GrepOptions,
  filePattern?: string,
  useGitignore = true,
  caseSensitiveFilePattern = true,
): Promise<GrepResult[]> {
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
        pathGroups.get(basePath)!.push(path);
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
        pathGroups.get(basePath)!.push(relativePath);
      }
    }

    // Process each group with its own cwd
    for (const [basePath, groupPaths] of pathGroups) {
      const patterns: string[] = [];
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
        "!**/temp/**",
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
                filePattern.toLowerCase(),
              );
              const upperPattern = pattern.replace(
                filePattern,
                filePattern.toUpperCase(),
              );
              const titlePattern = pattern.replace(
                filePattern,
                filePattern.charAt(0).toUpperCase() +
                  filePattern.slice(1).toLowerCase(),
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
          try {
            const fileResults = await searchFile(file, options);
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
          } catch (error) {
            // Skip files that can't be read (binary files, permission issues, etc.)
            continue;
          }
        }
      } catch (groupError) {
        // If globby fails for this group, skip it
        continue;
      }
    }
  } catch (error) {
    throw new Error(
      `Error searching files: ${error instanceof Error ? error.message : String(error)}`,
    );
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
        "File paths, directory paths, or glob patterns to search in (string or array of strings). Examples: 'src/', '**/*.ts', ['src/', 'tests/']",
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
        "Number of context lines around match (overrides before/after)",
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
  }) => {
    try {
      // Validate pattern early to catch invalid regex
      createPattern({
        pattern,
        ignoreCase,
        fixedStrings,
      });

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

      // Search files using globby
      const results = await searchFiles(
        pathArray,
        options,
        filePattern,
        useGitignore,
        !ignoreCase, // Use case-insensitive file patterns when ignoreCase is true
      );

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
        return `Found ${results.length} matches, showing first ${MAX_RESULTS}:\n\n${JSON.stringify(truncatedResults, null, 2)}`;
      }

      return JSON.stringify(formattedResults, null, 2);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Grep search failed: ${errorMessage}`);
    }
  },
});
