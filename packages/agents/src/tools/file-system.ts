import { tool } from "ai";
import z from "zod";
import { readdir, mkdir, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { globby } from "globby";
import { readFile as fsReadFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  platform,
  arch,
  release,
  hostname,
  cpus,
  totalmem,
  freemem,
  uptime,
} from "node:os";
import ignore from "ignore";
import { dirname, relative } from "node:path";

interface TreeEntry {
  name: string;
  type: "file" | "directory";
  size?: number;
  children?: TreeEntry[];
}

interface DirectoryStats {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  hiddenItems: number;
  ignoredItems: number;
}

interface FileInfo {
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
  isDirectory: boolean;
  isFile: boolean;
  permissions: string;
}

interface CharaConfig {
  dev?: string;
  info: {
    name?: string;
    description?: string;
    version?: string;
    frameworks?: string[];
    tools?: string[];
    stack?: string[];
    packageManager?: string;
    scripts?: Record<string, string>;
    dependencies?: string[];
    devDependencies?: string[];
    languages?: string[];
    projectType?: string;
  };
}

interface GitignoreManager {
  isIgnored(
    filePath: string,
    fromRoot?: string,
    isDirectory?: boolean,
  ): boolean;
  isDefaultIgnored(filePath: string): boolean;
}

const FileSystemAction = z.enum([
  "list",
  "tree",
  "create",
  "current",
  "stats",
  "find",
  "info",
  "env",
  "read",
]);

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
  rootPath: string,
): Promise<GitignoreManager> {
  const ig = ignore();
  const defaultIg = ignore();

  // Add default ignore patterns
  defaultIg.add(DEFAULT_IGNORE_PATTERNS);

  // Try to read .gitignore files from root and parent directories
  const gitignoreContents: string[] = [];

  // Function to collect gitignore files up the directory tree
  const collectGitignoreFiles = async (dirPath: string, maxLevels = 5) => {
    let currentPath = resolve(dirPath);
    let level = 0;

    while (level < maxLevels) {
      const gitignorePath = join(currentPath, ".gitignore");

      try {
        if (existsSync(gitignorePath)) {
          const content = await fsReadFile(gitignorePath, "utf-8");
          gitignoreContents.push(content);
        }
      } catch {
        // Ignore errors reading gitignore files
      }

      const parentPath = dirname(currentPath);
      if (parentPath === currentPath) break; // Reached root

      currentPath = parentPath;
      level++;
    }
  };

  await collectGitignoreFiles(rootPath);

  // Add all collected gitignore contents
  if (gitignoreContents.length > 0) {
    ig.add(gitignoreContents.join("\n"));
  }

  return {
    isIgnored(
      filePath: string,
      fromRoot?: string,
      isDirectory?: boolean,
    ): boolean {
      const checkPath = fromRoot
        ? relative(fromRoot, resolve(fromRoot, filePath))
        : filePath;

      // Normalize path - remove leading ./
      const normalizedPath = checkPath.startsWith("./")
        ? checkPath.slice(2)
        : checkPath;

      // Never ignore .gitignore files themselves
      if (
        normalizedPath === ".gitignore" ||
        normalizedPath.endsWith("/.gitignore")
      ) {
        return false;
      }

      // Always ignore the default patterns
      if (defaultIg.ignores(normalizedPath)) {
        return true;
      }

      // For directories, check with trailing slash
      const pathToCheck = isDirectory ? normalizedPath + "/" : normalizedPath;

      // Check custom gitignore patterns
      return ig.ignores(pathToCheck);
    },

    isDefaultIgnored(filePath: string): boolean {
      const normalizedPath = filePath.startsWith("./")
        ? filePath.slice(2)
        : filePath;
      return defaultIg.ignores(normalizedPath);
    },
  };
}

/**
 * Checks if a file/directory should be ignored based on name patterns
 */
function isAlwaysIgnored(name: string): boolean {
  return name === ".chara" || name === "node_modules" || name === ".git";
}

/**
 * Checks if a hidden file should be included even when includeHidden is false
 */
function isImportantHiddenFile(name: string): boolean {
  return name === ".gitignore" || name === ".chara.json";
}

// Helper function to provide suggestions for invalid actions
function getActionSuggestion(invalidAction: string): string {
  const validActions = [
    "list",
    "tree",
    "create",
    "current",
    "stats",
    "find",
    "info",
    "env",
    "read",
  ];

  // Common mappings for LLM mistakes
  const actionMappings: Record<string, string> = {
    grep: "find",
    search: "find",
    locate: "find",
    ls: "list",
    dir: "list",
    mkdir: "create",
    pwd: "current",
    cwd: "current",
    stat: "info",
    info: "info",
    details: "info",
    metadata: "info",
    structure: "tree",
    recursive: "tree",
    environment: "env",
    config: "env",
    statistics: "stats",
    summary: "stats",
  };

  // Check for direct mapping
  if (actionMappings[invalidAction.toLowerCase()]) {
    return `Did you mean "${actionMappings[invalidAction.toLowerCase()]}"? Valid actions are: ${validActions.join(", ")}`;
  }

  // Find closest match by string similarity with safety checks
  let bestMatch = validActions[0];
  let bestScore = 0;

  // Only calculate similarity if strings are reasonable length
  if (invalidAction.length <= 100) {
    for (const validAction of validActions) {
      try {
        const score = calculateSimilarity(
          invalidAction.toLowerCase(),
          validAction,
        );
        if (score > bestScore) {
          bestScore = score;
          bestMatch = validAction;
        }
      } catch (error) {
        // Skip similarity calculation if it fails
        continue;
      }
    }
  }

  return `Invalid action "${invalidAction}". Did you mean "${bestMatch}"? Valid actions are: ${validActions.join(", ")}`;
}

// Simple string similarity calculation with safety checks
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  // Safety check for string lengths
  if (longer.length > 1000 || shorter.length > 1000) {
    return 0.0;
  }

  try {
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  } catch (error) {
    // Return 0 similarity if calculation fails
    return 0.0;
  }
}

// Levenshtein distance calculation with safety checks
function levenshteinDistance(str1: string, str2: string): number {
  // Safety checks to prevent array overflow
  if (str1.length > 1000 || str2.length > 1000) {
    return Math.max(str1.length, str2.length);
  }

  if (str1.length === 0) return str2.length;
  if (str2.length === 0) return str1.length;

  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator,
      );
    }
  }

  return matrix[str2.length][str1.length];
}

// Helper function to preprocess patterns to prevent overflow
function preprocessPattern(pattern: string): string {
  // Handle empty or whitespace patterns
  if (!pattern || pattern.trim() === "") {
    return "**/*";
  }

  // Handle bare wildcard patterns
  if (pattern === "*" || pattern === "**") {
    return "**/*";
  }

  // Handle question mark only patterns
  if (pattern === "?" || pattern === "??") {
    return "**/*";
  }

  // Handle patterns like *tic*toe* which can cause overflow
  if (
    pattern.includes("*") &&
    !pattern.includes("|") &&
    !pattern.startsWith("**")
  ) {
    const segments = pattern.split("*").filter((s) => s.length > 0);

    // If no segments (like bare "*" or "**"), convert to safe recursive pattern
    if (segments.length === 0) {
      return "**/*";
    }

    // For simple patterns like *tic*, convert to recursive search
    if (segments.length === 1) {
      return `**/*${segments[0]}*`;
    }

    // If we have multiple segments with wildcards, convert to safer alternatives
    if (segments.length > 1 && segments.length <= 3) {
      // For moderate complexity, keep the original pattern but make it recursive
      return `**/${pattern}`;
    }

    // For very complex patterns, use brace expansion
    if (segments.length > 3 && segments.length <= 5) {
      return `**/*{${segments.join(",")}}*`;
    }

    // For extremely complex patterns, just use the first segment
    if (segments.length > 5) {
      return `**/*${segments[0]}*`;
    }
  }

  return pattern;
}

export const fileSystem = tool({
  description: `Comprehensive file system management tool with multiple operations:

**Directory Operations:**
- **list**: Get a flat listing of files and directories with type indicators
- **tree**: Get a recursive tree structure as JSON with optional depth limit
- **create**: Create new directories or files (with recursive parent creation)
- **current**: Get the current working directory path
- **stats**: Get detailed statistics about directory contents
- **find**: Search for files and directories using glob patterns (defaults to '**/*' if no pattern provided)

**File Operations:**
- **read**: Read the contents of a file
- **info**: Get detailed metadata about a specific file or directory (size, timestamps, permissions)

**Environment Information:**
- **env**: Get comprehensive environment information including project configuration from .chara.json and system details

**Features:**
- Full .gitignore support (reads .gitignore files up the directory tree)
- Automatic exclusion of .chara, node_modules, .git directories and common build/cache folders
- Support for hidden files and special characters
- Configurable depth limits for tree operations
- File size information where applicable
- Glob pattern matching for powerful file finding
- Detailed error handling and validation
- System and runtime information
- Project configuration analysis`,

  parameters: z.object({
    action: z
      .string()
      .describe(
        "Operation to perform: 'list', 'tree', 'create', 'current', 'stats', 'find', 'read', 'info', or 'env'",
      ),

    path: z
      .string()
      .optional()
      .describe(
        "File or directory path (defaults to current directory for most operations, required for create and info)",
      ),

    maxDepth: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe("Maximum depth for tree operation (default: unlimited)"),

    includeHidden: z
      .boolean()
      .default(false)
      .describe("Include hidden files and directories (starting with .)"),

    includeSize: z
      .boolean()
      .default(false)
      .describe("Include file sizes in tree and list operations"),

    pattern: z
      .string()
      .optional()
      .describe(
        "Glob pattern for find operation (e.g., '**/*.js', '*.txt'). Defaults to '**/*' if not specified.",
      ),

    excludePatterns: z
      .array(z.string())
      .default([])
      .describe("Additional glob patterns to exclude from results"),

    respectGitignore: z
      .boolean()
      .default(true)
      .describe("Whether to respect .gitignore files (default: true)"),

    workingDir: z
      .string()
      .optional()
      .describe(
        "Working directory for env operation (defaults to current directory)",
      ),

    includeSystem: z
      .boolean()
      .optional()
      .default(true)
      .describe("Include system information in env operation"),

    includeProject: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        "Include project information from .chara.json in env operation",
      ),

    returnErrorObjects: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Return structured error objects instead of throwing exceptions (for LLM usage)",
      ),
  }),

  execute: async ({
    action,
    path,
    maxDepth,
    includeHidden = false,
    includeSize = false,
    pattern,
    excludePatterns = [],
    respectGitignore = true,
    workingDir,
    includeSystem = true,
    includeProject = true,
    returnErrorObjects = false,
  }) => {
    // Top-level safety wrapper to catch any overflow errors
    try {
      const workingPath = path || process.cwd();

      // Validate action and provide suggestions if invalid
      const validActions = [
        "list",
        "tree",
        "create",
        "current",
        "stats",
        "find",
        "info",
        "env",
        "read",
      ];
      if (!validActions.includes(action)) {
        const errorResponse = {
          error: true,
          suggestion: getActionSuggestion(action),
          validActions,
          providedAction: action,
          message:
            "Invalid action provided. Please use one of the valid actions.",
        };
        if (returnErrorObjects) {
          return errorResponse;
        } else {
          throw new Error(`Unknown action: ${action}`);
        }
      }

      // Safety checks for potentially problematic operations
      if (maxDepth && maxDepth > 10) {
        const errorResponse = {
          error: true,
          suggestion: `maxDepth of ${maxDepth} is too large. Please use a value between 1-10 to prevent system resource issues.`,
          message: "maxDepth too large",
          providedMaxDepth: maxDepth,
          recommendedMaxDepth: Math.min(maxDepth, 5),
        };
        if (returnErrorObjects) {
          return errorResponse;
        } else {
          throw new Error(`maxDepth too large: ${maxDepth}`);
        }
      }

      // Pre-validate patterns for find operations to avoid preprocessing issues
      if (action === "find" && pattern) {
        const wildcardCount = (pattern.match(/\*/g) || []).length;
        const segments = pattern.split("*").filter((s) => s.length > 0);

        // Allow simple patterns like *tic* or **/*tic* (up to 6 wildcards, 4 segments)
        if (wildcardCount <= 6 && segments.length <= 4) {
          // Pattern is safe, continue
        } else if (wildcardCount > 15 || segments.length > 8) {
          const errorResponse = {
            error: true,
            suggestion: `Pattern "${pattern}" is too complex (${wildcardCount} wildcards, ${segments.length} segments). Try "**/*${segments[0]}*" or use separate searches.`,
            message: "Pattern too complex",
            providedPattern: pattern,
            simplifiedSuggestion: `**/*${segments[0]}*`,
          };
          if (returnErrorObjects) {
            return errorResponse;
          } else {
            throw new Error(`Pattern too complex: ${pattern}`);
          }
        }
      }

      try {
        switch (action) {
          case "current":
            return {
              operation: "current",
              path: process.cwd(),
              absolutePath: resolve(process.cwd()),
            };

          case "create": {
            if (!path) {
              throw new Error("Path is required for create operation");
            }
            // Check if path looks like a file (has extension) or directory
            const isFile = path.includes(".") && !path.endsWith("/");
            if (isFile) {
              // Create parent directory first
              const parentDir = path.split("/").slice(0, -1).join("/");
              if (parentDir) {
                await mkdir(parentDir, { recursive: true });
              }
              // Create empty file
              const { writeFile } = await import("fs/promises");
              await writeFile(path, "");
              return {
                operation: "create",
                type: "file",
                path,
                message: `Successfully created file: ${path}`,
              };
            } else {
              // Create directory
              await mkdir(path, { recursive: true });
              return {
                operation: "create",
                type: "directory",
                path,
                message: `Successfully created directory: ${path}`,
              };
            }
          }

          case "list":
            return await listDirectory(
              workingPath,
              includeHidden,
              includeSize,
              respectGitignore,
            );

          case "tree":
            return await getDirectoryTree(
              workingPath,
              maxDepth,
              includeHidden,
              includeSize,
              respectGitignore,
            );

          case "stats":
            return await getDirectoryStats(
              workingPath,
              includeHidden,
              respectGitignore,
            );

          case "find": {
            // Provide a default pattern if none is specified
            const searchPattern = pattern || "**/*";
            return await findInDirectory(
              workingPath,
              searchPattern,
              excludePatterns,
              includeHidden,
              respectGitignore,
            );
          }

          case "info":
            if (!path) {
              throw new Error("Path is required for info operation");
            }
            return await getFileInfo(path);

          case "env":
            return await getEnvironmentInfo(
              workingDir,
              includeSystem,
              includeProject,
            );

          case "read":
            if (!path) {
              throw new Error("Path is required for read operation");
            }
            return await readFileContents(path);

          default:
            return {
              error: true,
              suggestion: getActionSuggestion(action),
              validActions: [
                "list",
                "tree",
                "create",
                "current",
                "stats",
                "find",
                "info",
                "env",
                "read",
              ],
              providedAction: action,
              message:
                "Invalid action provided. Please use one of the valid actions.",
            };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Check if it's a parameter-related error and provide suggestions
        if (errorMessage.includes("Path is required")) {
          const errorResponse = {
            error: true,
            suggestion: `The "${action}" action requires a "path" parameter. Example: {"action": "${action}", "path": "/path/to/target"}`,
            message: `Missing required parameter for ${action} operation`,
            requiredParams: {
              action,
              path: "string (file or directory path)",
            },
          };
          if (returnErrorObjects) {
            return errorResponse;
          } else {
            throw new Error(`Path is required for ${action} operation`);
          }
        }

        // Handle other errors based on returnErrorObjects flag
        if (returnErrorObjects) {
          return {
            error: true,
            operation: action,
            message: `File system operation '${action}' failed: ${errorMessage}`,
            suggestion: "Check the operation parameters and try again",
            providedParams: { action, path },
          };
        } else {
          throw new Error(
            `File system operation '${action}' failed: ${errorMessage}`,
          );
        }
      }
    } catch (topLevelError) {
      const errorMessage =
        topLevelError instanceof Error
          ? topLevelError.message
          : String(topLevelError);

      // Catch any remaining array overflow or system resource errors
      // Check for array overflow or memory issues
      if (
        errorMessage.includes("Array length") ||
        errorMessage.includes("safe magnitude") ||
        errorMessage.includes("RangeError") ||
        errorMessage.includes("Maximum call stack") ||
        errorMessage.includes("out of memory") ||
        errorMessage.includes("ENOMEM")
      ) {
        const errorResponse = {
          error: true,
          operation: action,
          message: `System resource limits exceeded during ${action} operation`,
          suggestion:
            "Try using smaller parameters (lower maxDepth, more specific paths, or simpler patterns)",
          providedParams: { action, path, maxDepth, pattern },
          tip: "Large directories or complex patterns can cause memory issues. Use more targeted operations.",
          safetyRecommendations: [
            "Use maxDepth of 1-3 for tree operations",
            "Use specific subdirectories instead of root",
            "Use simple patterns like '**/*.ext' for find operations",
            "Break complex searches into multiple simpler ones",
          ],
          technicalError: errorMessage,
        };
        if (returnErrorObjects) {
          return errorResponse;
        } else {
          throw new Error(
            `System resource limits exceeded during ${action} operation`,
          );
        }
      }

      // For find operations with simple patterns, try a fallback approach
      if (action === "find" && pattern && pattern.split("*").length <= 3) {
        const errorResponse = {
          error: true,
          operation: action,
          message: `Find operation failed with pattern "${pattern}"`,
          suggestion: `Try using a simpler pattern like "**/*${pattern.replace(/\*/g, "")}*" or search in a specific subdirectory`,
          providedParams: { action, path, pattern },
          fallbackSuggestion: `**/*${pattern.replace(/\*/g, "")}*`,
          tip: "Sometimes glob patterns can cause issues with specific directory structures",
        };
        if (returnErrorObjects) {
          return errorResponse;
        } else {
          throw new Error(`Find operation failed with pattern "${pattern}"`);
        }
      }

      // Generic error fallback
      const errorResponse = {
        error: true,
        operation: action,
        message: `Unexpected error during ${action} operation: ${errorMessage}`,
        suggestion:
          "Check the operation parameters and try again with simpler values",
        providedParams: { action, path },
        technicalError: errorMessage,
      };
      if (returnErrorObjects) {
        return errorResponse;
      } else {
        throw new Error(
          `Unexpected error during ${action} operation: ${errorMessage}`,
        );
      }
    }
  },
});

async function listDirectory(
  dirPath: string,
  includeHidden: boolean,
  includeSize: boolean,
  respectGitignore: boolean,
) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const gitignoreManager = respectGitignore
      ? await createGitignoreManager(dirPath)
      : null;

    const items: Array<{
      name: string;
      type: "file" | "directory";
      size?: number;
      hidden: boolean;
      ignored?: boolean;
    }> = [];

    // Limit entries to prevent overflow
    const limitedEntries = entries.slice(0, 2000);
    if (entries.length > 2000) {
      console.warn(
        `Directory ${dirPath} has ${entries.length} entries, limiting to 2000`,
      );
    }

    for (const entry of limitedEntries) {
      const isHidden = entry.name.startsWith(".");
      const isAlwaysIgnoredItem = isAlwaysIgnored(entry.name);

      // Always skip certain directories
      if (isAlwaysIgnoredItem) {
        continue;
      }

      // Skip hidden files if not requested
      if (!includeHidden && isHidden && !isImportantHiddenFile(entry.name)) {
        continue;
      }

      // Check gitignore rules
      const isIgnored =
        gitignoreManager?.isIgnored(entry.name, dirPath, entry.isDirectory()) ||
        false;
      if (respectGitignore && isIgnored) {
        continue;
      }

      const item: any = {
        name: entry.name,
        type: entry.isDirectory() ? "directory" : "file",
        hidden: isHidden,
      };

      if (respectGitignore) {
        item.ignored = isIgnored;
      }

      if (includeSize && entry.isFile()) {
        try {
          const stats = await stat(resolve(dirPath, entry.name));
          item.size = stats.size;
        } catch {
          // Skip size if can't read stats
        }
      }

      items.push(item);
    }

    const formatted = items
      .map((item) => {
        const typeIndicator = item.type === "directory" ? "[DIR]" : "[FILE]";
        const sizeInfo =
          item.size !== undefined ? ` (${formatBytes(item.size)})` : "";
        const hiddenIndicator = item.hidden ? " (hidden)" : "";
        const ignoredIndicator = item.ignored ? " (ignored)" : "";
        return `${typeIndicator} ${item.name}${sizeInfo}${hiddenIndicator}${ignoredIndicator}`;
      })
      .join("\n");

    const result = {
      operation: "list",
      path: dirPath,
      count: items.length,
      items,
      respectGitignore,
      formatted: formatted || "Directory is empty",
    };

    // Add warning if we hit the limit
    if (entries.length > 2000) {
      result.warning = `Directory contains ${entries.length} entries, showing first 2000. Use 'find' action with patterns for more specific results.`;
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to list directory: ${errorMessage}`);
  }
}

async function getDirectoryTree(
  dirPath: string,
  maxDepth?: number,
  includeHidden: boolean = false,
  includeSize: boolean = false,
  respectGitignore: boolean = true,
  currentDepth: number = 0,
): Promise<any> {
  try {
    const gitignoreManager = respectGitignore
      ? await createGitignoreManager(dirPath)
      : null;

    async function buildTree(
      currentPath: string,
      depth: number = 0,
    ): Promise<TreeEntry[]> {
      if (maxDepth !== undefined && depth >= maxDepth) {
        return [];
      }

      try {
        const entries = await readdir(currentPath, { withFileTypes: true });
        const result: TreeEntry[] = [];

        // Limit the number of entries to prevent overflow
        const limitedEntries = entries.slice(0, 1000);
        if (entries.length > 1000) {
          console.warn(
            `Directory ${currentPath} has ${entries.length} entries, limiting to 1000`,
          );
        }

        for (const entry of limitedEntries) {
          const isHidden = entry.name.startsWith(".");
          const isAlwaysIgnoredItem = isAlwaysIgnored(entry.name);

          // Always skip certain directories
          if (isAlwaysIgnoredItem) {
            continue;
          }

          // Skip hidden files if not requested
          if (
            !includeHidden &&
            isHidden &&
            !isImportantHiddenFile(entry.name)
          ) {
            continue;
          }

          // Check gitignore rules
          const entryPath = resolve(currentPath, entry.name);
          const relativePath = relative(dirPath, entryPath);
          const isIgnored =
            gitignoreManager?.isIgnored(
              relativePath,
              dirPath,
              entry.isDirectory(),
            ) || false;

          if (respectGitignore && isIgnored) {
            continue;
          }

          const entryData: TreeEntry = {
            name: entry.name,
            type: entry.isDirectory() ? "directory" : "file",
          };

          if (includeSize && entry.isFile()) {
            try {
              const stats = await stat(entryPath);
              entryData.size = stats.size;
            } catch {
              // Skip size if can't read stats
            }
          }

          if (entry.isDirectory()) {
            try {
              entryData.children = await buildTree(entryPath, depth + 1);
            } catch {
              // Skip subdirectory if it can't be read
              entryData.children = [];
            }
          }

          result.push(entryData);
        }

        return result;
      } catch (error) {
        // Return empty array instead of throwing
        console.warn(
          `Failed to read directory ${currentPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return [];
      }
    }

    const tree = await buildTree(dirPath, currentDepth);

    return {
      operation: "tree",
      path: dirPath,
      maxDepth: maxDepth || "unlimited",
      includeHidden,
      includeSize,
      respectGitignore,
      tree,
      formatted: JSON.stringify(tree, null, 2),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to build directory tree: ${errorMessage}`);
  }
}

async function getDirectoryStats(
  dirPath: string,
  includeHidden: boolean,
  respectGitignore: boolean,
) {
  try {
    const stats: DirectoryStats = {
      totalFiles: 0,
      totalDirectories: 0,
      totalSize: 0,
      hiddenItems: 0,
      ignoredItems: 0,
    };

    // Always create gitignore manager to count ignored items even when not respecting gitignore
    const gitignoreManager = await createGitignoreManager(dirPath);
    let processedDirs = 0;
    const maxDirs = 5000; // Limit to prevent overflow

    async function collectStats(currentPath: string) {
      if (processedDirs >= maxDirs) {
        console.warn(
          `Directory stats collection stopped at ${maxDirs} directories to prevent overflow`,
        );
        return;
      }

      try {
        const entries = await readdir(currentPath, { withFileTypes: true });

        // Limit entries to prevent overflow
        const limitedEntries = entries.slice(0, 2000);
        if (entries.length > 2000) {
          console.warn(
            `Directory ${currentPath} has ${entries.length} entries, limiting to 2000`,
          );
        }

        for (const entry of limitedEntries) {
          const isHidden = entry.name.startsWith(".");
          const isAlwaysIgnoredItem = isAlwaysIgnored(entry.name);

          // Always skip certain directories
          if (isAlwaysIgnoredItem) {
            continue;
          }

          const entryPath = resolve(currentPath, entry.name);
          const relativePath = relative(dirPath, entryPath);
          const isIgnored =
            gitignoreManager?.isIgnored(
              relativePath,
              dirPath,
              entry.isDirectory(),
            ) || false;

          if (isHidden) {
            stats.hiddenItems++;
            if (!includeHidden && !isImportantHiddenFile(entry.name)) continue;
          }

          if (isIgnored) {
            stats.ignoredItems++;
          }

          if (entry.isDirectory()) {
            processedDirs++;
            // Always recurse into directories to count ignored items, even if directory itself is ignored
            if (processedDirs < maxDirs) {
              await collectStats(entryPath);
            }

            // Only count directory in totals if not ignored (when respecting gitignore)
            if (!isIgnored || !respectGitignore) {
              stats.totalDirectories++;
            }
          } else {
            // Only count file in totals if not ignored (when respecting gitignore)
            if (!isIgnored || !respectGitignore) {
              stats.totalFiles++;
              try {
                const fileStat = await stat(entryPath);
                stats.totalSize += fileStat.size;
              } catch {
                // Skip if can't read file stats
              }
            }
          }
        }
      } catch {
        // Skip directories that can't be accessed
      }
    }

    await collectStats(dirPath);

    const result = {
      operation: "stats",
      path: dirPath,
      includeHidden,
      respectGitignore,
      stats,
      formatted: `Directory Statistics for: ${dirPath}
- Total Files: ${stats.totalFiles}
- Total Directories: ${stats.totalDirectories}
- Total Size: ${formatBytes(stats.totalSize)}
- Hidden Items: ${stats.hiddenItems}${includeHidden ? " (included)" : " (excluded)"}
- Ignored Items: ${stats.ignoredItems}${respectGitignore ? " (excluded)" : " (would be excluded)"}`,
    };

    // Add warning if we hit limits
    if (processedDirs >= maxDirs) {
      result.warning = `Statistics collection was limited to ${maxDirs} directories to prevent system resource issues. Results may be incomplete for very large directory structures.`;
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to collect directory statistics: ${errorMessage}`);
  }
}

async function readFileContents(filePath: string) {
  try {
    const { readFile, stat } = await import("fs/promises");
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      throw new Error(`Path is a directory, not a file: ${filePath}`);
    }

    const content = await readFile(filePath, "utf-8");

    return {
      operation: "read",
      path: filePath,
      absolutePath: resolve(filePath),
      size: stats.size,
      content,
      encoding: "utf-8",
      message: `Successfully read file: ${filePath}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read file: ${errorMessage}`);
  }
}

async function findInDirectory(
  dirPath: string,
  pattern: string,
  excludePatterns: string[],
  includeHidden: boolean,
  respectGitignore: boolean,
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
        suggestion: `Pattern "${pat}" is too complex (${wildcardCount} wildcards, complexity score: ${complexityScore}). Try "**/*{${segments.slice(0, 3).join(",")}}*" or break into separate searches.`,
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
        suggestion: `Pattern "${pat}" has too many wildcard segments (${pat.split("*").length}). Try "**/*{${segments.slice(0, 3).join(",")}}*" or use separate searches for each term.`,
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
    p.startsWith("!") ? p : `!${p}`,
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
      (basePatterns[0].match(/\*/g) || []).length <= 2;
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

    // Log results for debugging
    console.log(
      `Find operation: pattern="${pattern}" found ${files.length} results`,
    );

    // If hidden files are not included, manually add important dotfiles
    let allFiles = files;
    if (!includeHidden) {
      const importantDotfiles = [".gitignore", ".chara.json"];
      for (const dotfile of importantDotfiles) {
        const dotfilePath = join(dirPath, dotfile);
        try {
          await stat(dotfilePath);
          // File exists, add it if not already in results
          if (!allFiles.includes(dotfile)) {
            allFiles.push(dotfile);
          }
        } catch {
          // File doesn't exist, skip
        }
      }
    }

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
                  `${r.type === "directory" ? "[DIR]" : "[FILE]"} ${r.path}`,
              )
              .join("\n")
          : "No matches found",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw new Error(
      `Find operation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function getFileInfo(filePath: string) {
  try {
    const stats = await stat(filePath);

    const fileInfo: FileInfo = {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      permissions: stats.mode.toString(8).slice(-3),
    };

    return {
      operation: "info",
      path: filePath,
      ...fileInfo,
      formattedInfo: Object.entries(fileInfo)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n"),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get file info for ${filePath}: ${errorMessage}`);
  }
}

async function getEnvironmentInfo(
  workingDir?: string,
  includeSystem: boolean = true,
  includeProject: boolean = true,
) {
  const cwd = workingDir || process.cwd();
  const result: any = {
    operation: "env",
    workingDirectory: cwd,
    timestamp: new Date().toISOString(),
  };

  // Project information from .chara.json
  if (includeProject) {
    const charaConfigPath = join(cwd, ".chara.json");

    try {
      if (existsSync(charaConfigPath)) {
        const configContent = await fsReadFile(charaConfigPath, "utf-8");
        const charaConfig: CharaConfig = JSON.parse(configContent);

        result.project = {
          hasCharaConfig: true,
          dev: charaConfig.dev,
          info: charaConfig.info,
        };
      } else {
        result.project = {
          hasCharaConfig: false,
          message:
            ".chara.json file not found. Run initialization to create project configuration.",
        };
      }
    } catch (error) {
      result.project = {
        hasCharaConfig: false,
        error: `Failed to read .chara.json: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Additional project files check
    const projectFiles = {
      packageJson: existsSync(join(cwd, "package.json")),
      readme:
        existsSync(join(cwd, "README.md")) ||
        existsSync(join(cwd, "readme.md")),
      gitignore: existsSync(join(cwd, ".gitignore")),
      tsconfig: existsSync(join(cwd, "tsconfig.json")),
      eslintrc:
        existsSync(join(cwd, ".eslintrc.js")) ||
        existsSync(join(cwd, ".eslintrc.json")),
      prettierrc:
        existsSync(join(cwd, ".prettierrc")) ||
        existsSync(join(cwd, "prettier.config.js")),
      dockerfile: existsSync(join(cwd, "Dockerfile")),
      dockerCompose:
        existsSync(join(cwd, "docker-compose.yml")) ||
        existsSync(join(cwd, "docker-compose.yaml")),
    };

    result.project.files = projectFiles;
  }

  // System information
  if (includeSystem) {
    const memory = {
      total: Math.round((totalmem() / 1024 / 1024 / 1024) * 100) / 100, // GB
      free: Math.round((freemem() / 1024 / 1024 / 1024) * 100) / 100, // GB
      used:
        Math.round(((totalmem() - freemem()) / 1024 / 1024 / 1024) * 100) / 100, // GB
    };

    result.system = {
      platform: platform(),
      architecture: arch(),
      release: release(),
      hostname: hostname(),
      uptime: Math.round((uptime() / 3600) * 100) / 100, // hours
      cpu: {
        model: cpus()[0]?.model || "Unknown",
        cores: cpus().length,
      },
      memory,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || "development",
    };

    // Runtime information
    result.runtime = {
      isBun: typeof Bun !== "undefined",
      isNode: typeof process !== "undefined" && !!process.versions?.node,
      nodeVersion: process.versions?.node || null,
      processId: process.pid,
      processTitle: process.title,
      execPath: process.execPath,
    };

    // Environment variables (filtered for security)
    const safeEnvVars = [
      "NODE_ENV",
      "PATH",
      "HOME",
      "USER",
      "SHELL",
      "TERM",
      "PWD",
      "LANG",
      "LC_ALL",
      "TZ",
      "CI",
      "GITHUB_ACTIONS",
      "VERCEL",
      "NETLIFY",
    ];

    result.environment = {};
    safeEnvVars.forEach((key) => {
      if (process.env[key]) {
        result.environment[key] = process.env[key];
      }
    });
  }

  return result;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
