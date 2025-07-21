import { tool } from "ai";
import { globby } from "globby";
import ignore from "ignore";
import { readFile as fsReadFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import z from "zod";

interface GitignoreManager {
  isIgnored(
    filePath: string,
    fromRoot?: string,
    isDirectory?: boolean
  ): boolean;
}

// Default directories and patterns to always ignore
const DEFAULT_IGNORE_PATTERNS = [
  ".chara",
  ".chara/",
  ".chara/**",
  "node_modules",
  "node_modules/",
  "node_modules/**",
  ".git",
  ".git/",
  ".git/**",
];

/**
 * Creates a gitignore manager that handles both .gitignore rules and default exclusions
 */
async function createGitignoreManager(
  startPath: string
): Promise<GitignoreManager> {
  const gitignoreFiles: string[] = [];
  const ignoreInstances: Array<{ ig: ReturnType<typeof ignore>; dir: string }> =
    [];

  // Only look for .gitignore files within the search directory and its immediate parent
  const searchDir = resolve(startPath);
  const parentDir = dirname(searchDir);

  // Check for .gitignore in the search directory
  const searchDirGitignore = join(searchDir, ".gitignore");
  try {
    await fsReadFile(searchDirGitignore, "utf-8");
    gitignoreFiles.push(searchDirGitignore);
  } catch {
    // No .gitignore in search directory
  }

  // Check for .gitignore in parent directory (but only one level up)
  if (parentDir !== searchDir) {
    const parentGitignore = join(parentDir, ".gitignore");
    try {
      await fsReadFile(parentGitignore, "utf-8");
      gitignoreFiles.push(parentGitignore);
    } catch {
      // No .gitignore in parent directory
    }
  }

  // Load and parse .gitignore files
  for (const gitignoreFile of gitignoreFiles) {
    try {
      const content = await fsReadFile(gitignoreFile, "utf-8");
      const ig = ignore().add(content);
      ignoreInstances.push({
        ig,
        dir: dirname(gitignoreFile),
      });
    } catch {
      // Skip files that can't be read
      console.warn(`Could not read .gitignore file: ${gitignoreFile}`);
    }
  }

  return {
    isIgnored(
      filePath: string,
      fromRoot: string = startPath,
      _isDirectory: boolean = false
    ): boolean {
      // Always ignore default patterns
      const defaultIgnored = DEFAULT_IGNORE_PATTERNS.some((pattern) => {
        if (pattern.endsWith("/**")) {
          const basePattern = pattern.slice(0, -3);
          return (
            filePath.startsWith(basePattern + "/") || filePath === basePattern
          );
        }
        if (pattern.endsWith("/")) {
          return (
            filePath.startsWith(pattern) || filePath === pattern.slice(0, -1)
          );
        }
        return filePath === pattern || filePath.startsWith(pattern + "/");
      });

      if (defaultIgnored) {
        return true;
      }

      // Check against .gitignore rules only from relevant directories
      for (const { ig, dir } of ignoreInstances) {
        try {
          // Only apply gitignore rules from directories that are parents of or equal to the search directory
          const searchDirResolved = resolve(fromRoot);
          if (!searchDirResolved.startsWith(dir) && dir !== searchDirResolved) {
            continue;
          }

          const absolutePath = resolve(fromRoot, filePath);
          const relativePath = absolutePath.startsWith(dir)
            ? absolutePath.slice(dir.length).replace(/^\//, "")
            : filePath;

          if (relativePath && ig.ignores(relativePath)) {
            return true;
          }
        } catch {
          // Skip invalid paths
          continue;
        }
      }

      return false;
    },
  };
}

function preprocessPattern(pattern: string): string {
  // Remove any leading/trailing whitespace
  pattern = pattern.trim();

  // Handle empty pattern
  if (!pattern) {
    return "**/*";
  }

  // If pattern doesn't start with ** and contains wildcards, make it recursive
  if (!pattern.startsWith("**/") && pattern.includes("*")) {
    // Check if it's a simple filename pattern like "*.js"
    if (pattern.match(/^\*\.\w+$/)) {
      return `**/${pattern}`;
    }
    // Check if it's a simple contains pattern like "*word*"
    if (pattern.match(/^\*[^*]+\*$/)) {
      return `**/${pattern}`;
    }
    // For other patterns, make them recursive
    if (!pattern.startsWith("**/")) {
      pattern = `**/${pattern}`;
    }
  }

  // Escape special regex characters but preserve glob wildcards
  // This is a simplified approach - in practice, you might want more sophisticated handling
  return pattern;
}

async function findInDirectory(
  dirPath: string,
  pattern: string,
  excludePatterns: string[],
  includeHidden: boolean,
  respectGitignore: boolean
) {
  // Convert pipe-separated patterns to array of glob patterns
  // Also sanitize patterns to prevent array overflow issues
  let basePatterns: string[];

  if (pattern.includes("|")) {
    const splitPatterns = pattern.split("|").map((p) => p.trim());
    // Limit number of patterns to prevent overflow
    if (splitPatterns.length > 50) {
      return {
        error: true,
        suggestion: `Too many patterns (${splitPatterns.length}). Please limit to 50 or fewer patterns, or use broader glob patterns like "**/*{tic,toe,tac}*".`,
        message: "Pattern contains too many alternatives",
        providedPattern: pattern,
        patternCount: splitPatterns.length,
      };
    }
    basePatterns = splitPatterns.map(preprocessPattern);
  } else {
    // Preprocess single pattern to prevent overflow
    const processedPattern = preprocessPattern(pattern);
    basePatterns = [processedPattern];
  }

  // Validate each pattern for complexity that might cause overflow
  for (const pat of basePatterns) {
    if (pat.length > 300) {
      return {
        error: true,
        suggestion: `Pattern "${pat}" is too long (${pat.length} characters). Please use shorter, simpler patterns.`,
        message: "Individual pattern too long",
        providedPattern: pat,
      };
    }

    // Check for complex patterns that might cause array overflow
    const wildcardCount = (pat.match(/\*/g) || []).length;
    const questionMarkCount = (pat.match(/\?/g) || []).length;
    const complexityScore = wildcardCount * 2 + questionMarkCount;

    if (complexityScore > 25) {
      const segments = pat.split("*").filter((s) => s.length > 0);
      return {
        error: true,
        suggestion: `Pattern "${pat}" is too complex (${wildcardCount} wildcards, complexity score: ${complexityScore}). Try "**/*{${segments
          .slice(0, 3)
          .join(",")}}*" or break into separate searches.`,
        message: "Pattern too complex - might cause overflow",
        providedPattern: pat,
        complexityScore,
        simplifiedSuggestion: `**/*{${segments.slice(0, 3).join(",")}}*`,
        tip: "Use **/*word* for simple contains searches, or **/*.ext for file extensions",
      };
    }

    // Special check for patterns like *word*word* which can cause exponential expansion
    if (pat.includes("*") && pat.split("*").length > 6) {
      const segments = pat.split("*").filter((s) => s.length > 0);
      return {
        error: true,
        suggestion: `Pattern "${pat}" has too many wildcard segments (${
          pat.split("*").length
        }). Try "**/*{${segments
          .slice(0, 3)
          .join(",")}}*" or use separate searches for each term.`,
        message: "Pattern has too many wildcard segments",
        providedPattern: pat,
        segmentCount: pat.split("*").length,
        simplifiedSuggestion: `**/*{${segments.slice(0, 3).join(",")}}*`,
        alternativeSuggestions: segments.slice(0, 3).map((s) => `**/*${s}*`),
      };
    }
  }

  const gitignoreManager = respectGitignore
    ? await createGitignoreManager(dirPath)
    : null;

  // Default exclusions (always applied regardless of gitignore setting)
  const defaultExclusions = [
    "!**/.chara/**",
    "!**/.git/**",
    "!**/node_modules/**",
    "!**/.svelte-kit/**",
    "!**/build/**",
    "!**/dist/**",
    "!**/.next/**",
    "!**/coverage/**",
  ];

  // Additional common exclusions when not using gitignore (disabled for now)
  const commonExclusions: string[] = [];

  // Add user exclusions
  const userExclusions = excludePatterns.map((p) =>
    p.startsWith("!") ? p : `!${p}`
  );

  // Hidden files exclusion
  const hiddenExclusions = includeHidden ? [] : ["!**/.*"];

  const allPatterns = [
    ...basePatterns,
    ...defaultExclusions,
    ...commonExclusions,
    ...userExclusions,
    ...hiddenExclusions,
  ];

  // Check total pattern count to prevent overflow
  if (allPatterns.length > 100) {
    return {
      error: true,
      suggestion: `Total pattern count (${allPatterns.length}) exceeds safe limit. Please use fewer, broader patterns.`,
      message: "Too many total patterns",
      totalPatterns: allPatterns.length,
    };
  }

  try {
    // Simplified approach using only the base patterns with proper exclusions
    const safePatterns = basePatterns.concat([
      "!**/node_modules/**",
      "!**/.git/**",
      "!**/.chara/**",
      "!**/.svelte-kit/**",
      "!**/build/**",
      "!**/dist/**",
      "!**/.next/**",
      "!**/coverage/**",
      ...userExclusions,
    ]);

    if (!includeHidden) {
      safePatterns.push("!**/.*");
    }

    // Add timeout and safety checks for complex patterns
    const globbyOptions = {
      cwd: dirPath,
      onlyFiles: false, // Include both files and directories
      markDirectories: true,
      absolute: false,
      dot: includeHidden,
      followSymbolicLinks: false,
      caseSensitiveMatch: false,
      // Add safety limits
      deep: 8, // Allow deeper search since we're excluding large dirs
      suppressErrors: true, // Don't fail on permission errors
    };

    // For simple patterns, use a shorter timeout
    const isSimplePattern =
      basePatterns.length === 1 &&
      (basePatterns[0]?.match(/\*/g) || []).length <= 2;
    const timeoutMs = isSimplePattern ? 5000 : 10000;

    // Wrap globby in a Promise.race to add timeout
    const globbyPromise = globby(safePatterns, globbyOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Pattern search timeout")), timeoutMs);
    });

    const files = (await Promise.race([
      globbyPromise,
      timeoutPromise,
    ])) as string[];

    // Use the files as-is from globby - it already handles patterns correctly
    const allFiles = files;

    // Filter by gitignore rules if enabled
    const filteredFiles =
      respectGitignore && gitignoreManager
        ? allFiles.filter((file) => {
            const isDirectory = file.endsWith("/");
            const cleanPath = isDirectory ? file.slice(0, -1) : file;
            return !gitignoreManager.isIgnored(cleanPath, dirPath, isDirectory);
          })
        : allFiles;

    const results = filteredFiles.map((file) => {
      const isDirectory = file.endsWith("/");
      const cleanPath = isDirectory ? file.slice(0, -1) : file;
      return {
        path: cleanPath,
        type: isDirectory ? "directory" : "file",
        relativePath: file,
        absolutePath: resolve(dirPath, cleanPath),
      };
    });

    return {
      operation: "find",
      searchPath: dirPath,
      pattern,
      originalPattern: pattern,
      preprocessedPatterns: basePatterns,
      excludePatterns,
      includeHidden,
      respectGitignore,
      count: results.length,
      totalFound: files.length,
      results,
      formatted:
        results.length > 0
          ? results
              .map(
                (r) =>
                  `${r.type === "directory" ? "[DIR]" : "[FILE]"} ${r.path}`
              )
              .join("\n")
          : "No matches found",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      error: true,
      operation: "find",
      message: `Find operation failed: ${errorMessage}`,
      suggestion:
        "Check the pattern and path parameters, then try again with simpler values",
      providedParams: { pattern, excludePatterns },
      technicalError: errorMessage,
    };
  }
}

export const find = tool({
  description: `Search for files and directories using glob patterns with comprehensive filtering and safety features:

**Pattern Matching:**
- Supports glob patterns (e.g., '**/*.js', '*.txt', '**/test/**')
- Pipe-separated patterns for multiple searches (e.g., '*.js|*.ts')
- Defaults to '**/*' if no pattern provided
- Automatic preprocessing for common patterns

**Filtering Options:**
- Full .gitignore support (reads .gitignore files from search directory and parent)
- Automatic exclusion of .chara, node_modules, .git directories and common build/cache folders
- Support for hidden files and special characters
- Custom exclude patterns
- Respects pattern matching - only files matching the specified pattern are returned

**Safety Features:**
- Pattern complexity validation to prevent system overload
- Timeout protection for long-running searches
- Memory usage optimization
- Detailed error handling with suggestions

**Output:**
- Structured results with file/directory type, paths, and metadata
- Formatted output for easy reading
- Search statistics and pattern information`,

  parameters: z.object({
    path: z
      .string()
      .optional()
      .describe("Directory path to search in (defaults to current directory)"),

    pattern: z
      .string()
      .optional()
      .describe(
        "Glob pattern for search (e.g., '**/*.js', '*.txt'). Defaults to '**/*' if not specified. Supports pipe-separated patterns."
      ),

    excludePatterns: z
      .array(z.string())
      .default([])
      .describe("Additional glob patterns to exclude from results"),

    includeHidden: z
      .boolean()
      .default(false)
      .describe("Include hidden files and directories (starting with .)"),

    respectGitignore: z
      .boolean()
      .default(true)
      .describe("Whether to respect .gitignore files (default: true)"),
  }),

  execute: async ({
    path,
    pattern,
    excludePatterns = [],
    includeHidden = false,
    respectGitignore = true,
  }) => {
    try {
      const searchPath = path || process.cwd();
      const searchPattern = pattern || "**/*";

      // Pre-validate patterns to avoid preprocessing issues
      if (pattern) {
        const wildcardCount = (pattern.match(/\*/g) || []).length;
        const segments = pattern.split("*").filter((s) => s.length > 0);

        // Allow simple patterns like *tic* or **/*tic* (up to 6 wildcards, 4 segments)
        if (wildcardCount <= 6 && segments.length <= 4) {
          // Pattern is safe, continue
        } else if (wildcardCount > 15 || segments.length > 8) {
          return {
            error: true,
            suggestion: `Pattern "${pattern}" is too complex (${wildcardCount} wildcards, ${segments.length} segments). Try "**/*${segments[0]}*" or use separate searches.`,
            message: "Pattern too complex",
            providedPattern: pattern,
            simplifiedSuggestion: `**/*${segments[0]}*`,
          };
        }
      }

      return await findInDirectory(
        searchPath,
        searchPattern,
        excludePatterns,
        includeHidden,
        respectGitignore
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Handle specific error types
      if (
        errorMessage.includes("Array length") ||
        errorMessage.includes("safe magnitude") ||
        errorMessage.includes("RangeError") ||
        errorMessage.includes("Maximum call stack") ||
        errorMessage.includes("out of memory") ||
        errorMessage.includes("ENOMEM")
      ) {
        return {
          error: true,
          operation: "find",
          message: "System resource limits exceeded during find operation",
          suggestion:
            "Try using simpler patterns or more specific paths. Use patterns like '**/*.ext' for file extensions or '**/*word*' for simple contains searches.",
          providedParams: { path, pattern, excludePatterns },
          tip: "Large directories or complex patterns can cause memory issues. Use more targeted searches.",
          safetyRecommendations: [
            "Use simple patterns like '**/*.ext' for file extensions",
            "Use specific subdirectories instead of searching from root",
            "Break complex searches into multiple simpler ones",
            "Limit wildcard usage to prevent exponential expansion",
          ],
          technicalError: errorMessage,
        };
      }

      // Pattern timeout error
      if (errorMessage.includes("Pattern search timeout")) {
        return {
          error: true,
          operation: "find",
          message: `Find operation timed out with pattern "${pattern}"`,
          suggestion:
            "Try using a simpler pattern or search in a more specific directory",
          providedParams: { path, pattern, excludePatterns },
          tip: "Complex patterns or large directories can cause timeouts",
        };
      }

      // Generic error fallback
      return {
        error: true,
        operation: "find",
        message: `Find operation failed: ${errorMessage}`,
        suggestion:
          "Check the pattern and path parameters, then try again with simpler values",
        providedParams: { path, pattern, excludePatterns },
        technicalError: errorMessage,
      };
    }
  },
});
