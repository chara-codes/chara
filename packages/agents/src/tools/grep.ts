import { tool } from "ai";
import z from "zod";
import { readdir, stat } from "node:fs/promises";
import { join, basename, dirname } from "node:path";

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

class GrepEngine {
  private pattern: RegExp | string;
  private ignoreCase: boolean;
  private fixedStrings: boolean;
  private invertMatch: boolean;
  private lineNumber: boolean;
  private beforeContext: number;
  private afterContext: number;
  private maxCount: number;

  constructor(options: {
    pattern: string;
    ignoreCase?: boolean;
    fixedStrings?: boolean;
    invertMatch?: boolean;
    lineNumber?: boolean;
    beforeContext?: number;
    afterContext?: number;
    context?: number;
    maxCount?: number;
  }) {
    this.ignoreCase = options.ignoreCase || false;
    this.fixedStrings = options.fixedStrings || false;
    this.invertMatch = options.invertMatch || false;
    this.lineNumber = options.lineNumber ?? true;
    this.maxCount = options.maxCount || 0;

    // Handle context parameter
    if (options.context !== undefined) {
      this.beforeContext = options.context;
      this.afterContext = options.context;
    } else {
      this.beforeContext = options.beforeContext || 0;
      this.afterContext = options.afterContext || 0;
    }

    // Setup pattern
    if (this.fixedStrings) {
      // For fixed strings, escape regex special characters
      const escapedPattern = options.pattern.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      const flags = this.ignoreCase ? "gi" : "g";
      this.pattern = new RegExp(escapedPattern, flags);
    } else {
      // For regex patterns
      const flags = this.ignoreCase ? "gi" : "g";
      try {
        this.pattern = new RegExp(options.pattern, flags);
      } catch {
        throw new Error(`Invalid regular expression: ${options.pattern}`);
      }
    }
  }

  private matchesPattern(line: string): boolean {
    if (this.pattern instanceof RegExp) {
      const matches = this.pattern.test(line);
      // Reset regex lastIndex to avoid stateful issues
      this.pattern.lastIndex = 0;
      return matches !== this.invertMatch;
    }

    // Fallback string matching
    const matches = this.ignoreCase
      ? line.toLowerCase().includes(this.pattern.toLowerCase())
      : line.includes(this.pattern);
    return matches !== this.invertMatch;
  }

  private getMatches(line: string): Array<{ start: number; end: number }> {
    if (this.invertMatch || !(this.pattern instanceof RegExp)) {
      return [];
    }

    const matches: Array<{ start: number; end: number }> = [];
    let match: RegExpExecArray | null;

    // Reset regex to start from beginning
    this.pattern.lastIndex = 0;

    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    while ((match = this.pattern.exec(line)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length });

      // Prevent infinite loop on zero-length matches
      if (match[0].length === 0) {
        this.pattern.lastIndex++;
      }

      // For global flag, continue until no more matches
      if (!this.pattern.global) {
        break;
      }
    }

    // Reset regex lastIndex
    this.pattern.lastIndex = 0;
    return matches;
  }

  async searchFile(filePath: string): Promise<GrepResult[]> {
    try {
      const { readFile } = await import("node:fs/promises");
      const content = await readFile(filePath, "utf-8");
      const lines = content.split("\n");

      const results: GrepResult[] = [];
      let matchCount = 0;

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        if (line === undefined) continue;

        const lineNum = lineIdx + 1;

        if (this.matchesPattern(line)) {
          const matches = this.getMatches(line);

          if (this.beforeContext > 0 || this.afterContext > 0) {
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

            if (this.lineNumber && result.match) {
              result.match.line_num = lineNum;
            }

            // Add before context
            const beforeStart = Math.max(0, lineIdx - this.beforeContext);
            for (let i = beforeStart; i < lineIdx; i++) {
              const contextLine = lines[i];
              if (contextLine === undefined) continue;

              const contextMatch: GrepMatch = {
                file: filePath,
                line: contextLine,
                matches: [],
              };
              if (this.lineNumber) {
                contextMatch.line_num = i + 1;
              }
              if (result.before_context) {
                result.before_context.push(contextMatch);
              }
            }

            // Add after context
            const afterEnd = Math.min(
              lines.length,
              lineIdx + this.afterContext + 1,
            );
            for (let i = lineIdx + 1; i < afterEnd; i++) {
              const contextLine = lines[i];
              if (contextLine === undefined) continue;

              const contextMatch: GrepMatch = {
                file: filePath,
                line: contextLine,
                matches: [],
              };
              if (this.lineNumber) {
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

            if (this.lineNumber) {
              match.line_num = lineNum;
            }

            results.push({ match });
          }

          matchCount++;
          if (this.maxCount > 0 && matchCount >= this.maxCount) {
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

  async searchFiles(
    paths: string[],
    recursive = false,
    filePattern?: string,
  ): Promise<GrepResult[]> {
    const results: GrepResult[] = [];
    let totalMatches = 0;

    for (const path of paths) {
      try {
        const pathStat = await stat(path);

        if (pathStat.isDirectory()) {
          if (recursive) {
            const dirResults = await this.searchDirectory(
              path,
              filePattern,
              true,
            );
            for (const result of dirResults) {
              results.push(result);
              totalMatches++;
              if (this.maxCount > 0 && totalMatches >= this.maxCount) {
                return results;
              }
            }
          } else {
            const dirResults = await this.searchDirectory(
              path,
              filePattern,
              false,
            );
            for (const result of dirResults) {
              results.push(result);
              totalMatches++;
              if (this.maxCount > 0 && totalMatches >= this.maxCount) {
                return results;
              }
            }
          }
        } else if (pathStat.isFile()) {
          if (
            !filePattern ||
            this.matchesFilePattern(basename(path), filePattern)
          ) {
            const fileResults = await this.searchFile(path);
            for (const result of fileResults) {
              results.push(result);
              totalMatches++;
              if (this.maxCount > 0 && totalMatches >= this.maxCount) {
                return results;
              }
            }
          }
        }
      } catch (error) {
        // Skip files that can't be accessed
      }
    }

    return results;
  }

  private async searchDirectory(
    dirPath: string,
    filePattern?: string,
    recursive = false,
  ): Promise<GrepResult[]> {
    const results: GrepResult[] = [];
    let totalMatches = 0;

    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isFile()) {
          if (
            !filePattern ||
            this.matchesFilePattern(entry.name, filePattern)
          ) {
            try {
              const fileResults = await this.searchFile(fullPath);
              for (const result of fileResults) {
                results.push(result);
                totalMatches++;
                if (this.maxCount > 0 && totalMatches >= this.maxCount) {
                  return results;
                }
              }
            } catch {
              // Skip files that can't be read
            }
          }
        } else if (entry.isDirectory() && recursive) {
          const subResults = await this.searchDirectory(
            fullPath,
            filePattern,
            recursive,
          );
          for (const result of subResults) {
            results.push(result);
            totalMatches++;
            if (this.maxCount > 0 && totalMatches >= this.maxCount) {
              return results;
            }
          }
        }
      }
    } catch {
      // Skip directories that can't be accessed
    }

    return results;
  }

  private matchesFilePattern(filename: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regexPattern = pattern
      .replace(/\./g, "\\.")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");

    const regex = new RegExp(`^${regexPattern}$`, this.ignoreCase ? "i" : "");
    return regex.test(filename);
  }
}

export const grep = tool({
  description:
    "Search for patterns in files using grep-like functionality. Supports regex patterns, recursive directory search, context lines, and various filtering options.",
  parameters: z.object({
    pattern: z
      .string()
      .describe("Pattern to search for (supports regular expressions)"),
    paths: z
      .union([z.string(), z.array(z.string())])
      .describe(
        "File or directory paths to search in (string or array of strings)",
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
    recursive: z
      .boolean()
      .default(false)
      .describe("Search directories recursively"),
    invertMatch: z
      .boolean()
      .default(false)
      .describe("Select non-matching lines"),
    lineNumber: z.boolean().default(true).describe("Show line numbers"),
    filePattern: z
      .string()
      .optional()
      .describe("Pattern to filter files (e.g., '*.txt')"),
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
    recursive = false,
    invertMatch = false,
    lineNumber = true,
    filePattern,
  }) => {
    try {
      // Convert single path to array
      const pathArray = Array.isArray(paths) ? paths : [paths];

      // Create grep engine
      const grepEngine = new GrepEngine({
        pattern,
        ignoreCase,
        fixedStrings,
        invertMatch,
        lineNumber,
        beforeContext,
        afterContext,
        context,
        maxCount,
      });

      // Search files
      const results = await grepEngine.searchFiles(
        pathArray,
        recursive,
        filePattern,
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
