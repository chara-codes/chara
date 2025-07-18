import { tool } from "ai";
import ignore from "ignore";
import { existsSync } from "node:fs";
import { readFile as fsReadFile, readdir, stat } from "node:fs/promises";
import {
  arch,
  cpus,
  freemem,
  hostname,
  platform,
  release,
  totalmem,
  uptime,
} from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import z from "zod";

interface DirectoryStats {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  hiddenItems: number;
  ignoredItems: number;
  warning?: string;
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

interface EnvironmentInfo {
  operation: string;
  workingDirectory: string;
  timestamp: string;
  project?: {
    hasCharaConfig?: boolean;
    dev?: string;
    info?: {
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
    message?: string;
    error?: string;
    files?: Record<string, boolean>;
  };
  system?: {
    platform: string;
    architecture: string;
    release: string;
    hostname: string;
    uptime: number;
    cpu: {
      model: string;
      cores: number;
    };
    memory: {
      total: number;
      free: number;
      used: number;
    };
    nodeVersion: string;
    environment: string;
  };
  runtime?: {
    isBun: boolean;
    isNode: boolean;
    nodeVersion: string | null;
    processId: number;
    processTitle: string;
    execPath: string;
  };
  environment?: Record<string, string>;
}

interface GitignoreManager {
  isIgnored(
    filePath: string,
    fromRoot?: string,
    isDirectory?: boolean
  ): boolean;
  isDefaultIgnored(filePath: string): boolean;
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
  rootPath: string
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
      isDirectory?: boolean
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
  const validActions = ["stats", "info", "env"];

  // Common mappings for LLM mistakes
  const actionMappings: Record<string, string> = {
    grep: "stats",
    search: "stats",
    locate: "info",
    stat: "info",
    details: "info",
    metadata: "info",
    environment: "env",
    config: "env",
    statistics: "stats",
    summary: "stats",
  };

  // Check for direct mapping
  if (actionMappings[invalidAction.toLowerCase()]) {
    return `Did you mean "${
      actionMappings[invalidAction.toLowerCase()]
    }"? Valid actions are: ${validActions.join(", ")}`;
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
          validAction
        );
        if (score > bestScore) {
          bestScore = score;
          bestMatch = validAction;
        }
      } catch (_error) {
        // Skip similarity calculation if it fails
        continue;
      }
    }
  }

  return `Invalid action "${invalidAction}". Did you mean "${bestMatch}"? Valid actions are: ${validActions.join(
    ", "
  )}`;
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
  } catch (_error) {
    // Return 0 similarity if calculation fails
    return 0.0;
  }
}

// Levenshtein distance calculation with safety checks
function levenshteinDistance(str1: string, str2: string): number {
  // Safety checks to prevent array overflow
  if (str1.length > 100 || str2.length > 100) {
    return Math.max(str1.length, str2.length);
  }

  if (str1.length === 0) return str2.length;
  if (str2.length === 0) return str1.length;

  // Simple character difference count for small strings
  let differences = 0;
  const minLength = Math.min(str1.length, str2.length);

  for (let i = 0; i < minLength; i++) {
    if (str1[i] !== str2[i]) {
      differences++;
    }
  }

  // Add length difference
  differences += Math.abs(str1.length - str2.length);

  return differences;
}

export const fileSystem = tool({
  description: `Comprehensive file system management tool with multiple operations:

**Directory Operations:**
- **stats**: Get detailed statistics about directory contents

**File Operations:**
- **info**: Get detailed metadata about a specific file or directory (size, timestamps, permissions)

**Environment Information:**
- **env**: Get comprehensive environment information including project configuration from .chara.json and system details

**Features:**
- Full .gitignore support (reads .gitignore files up the directory tree)
- Automatic exclusion of .chara, node_modules, .git directories and common build/cache folders
- Support for hidden files and special characters
- Detailed error handling and validation
- System and runtime information
- Project configuration analysis`,

  parameters: z.object({
    action: z
      .string()
      .describe("Operation to perform: 'stats', 'info', or 'env'"),

    path: z
      .string()
      .optional()
      .describe(
        "File or directory path (defaults to current directory for most operations, required for info)"
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

    respectGitignore: z
      .boolean()
      .default(true)
      .describe("Whether to respect .gitignore files (default: true)"),

    workingDir: z
      .string()
      .optional()
      .describe(
        "Working directory for env operation (defaults to current directory)"
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
        "Include project information from .chara.json in env operation"
      ),

    returnErrorObjects: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Return structured error objects instead of throwing exceptions (for LLM usage)"
      ),
  }),

  execute: async ({
    action,
    path,
    maxDepth,
    includeHidden = false,
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
      const validActions = ["stats", "info", "env"];
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

      try {
        switch (action) {
          case "stats":
            return await getDirectoryStats(
              workingPath,
              includeHidden,
              respectGitignore
            );

          case "info":
            if (!path) {
              throw new Error("Path is required for info operation");
            }
            return await getFileInfo(path);

          case "env":
            return await getEnvironmentInfo(
              workingDir,
              includeSystem,
              includeProject
            );

          default:
            return {
              error: true,
              suggestion: getActionSuggestion(action),
              validActions: ["stats", "info", "env"],
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
            `File system operation '${action}' failed: ${errorMessage}`
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
          providedParams: { action, path, maxDepth },
          tip: "Large directories or complex patterns can cause memory issues. Use more targeted operations.",
          safetyRecommendations: [
            "Use maxDepth of 1-3 for tree operations",
            "Use specific subdirectories instead of root",
            "Use stats for directory overviews",
            "Break complex searches into multiple simpler ones",
          ],
          technicalError: errorMessage,
        };
        if (returnErrorObjects) {
          return errorResponse;
        } else {
          throw new Error(
            `System resource limits exceeded during ${action} operation`
          );
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
          `Unexpected error during ${action} operation: ${errorMessage}`
        );
      }
    }
  },
});

async function getDirectoryStats(
  dirPath: string,
  includeHidden: boolean,
  respectGitignore: boolean
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
          `Directory stats collection stopped at ${maxDirs} directories to prevent overflow`
        );
        return;
      }

      try {
        const entries = await readdir(currentPath, { withFileTypes: true });

        // Limit entries to prevent overflow
        const limitedEntries = entries.slice(0, 2000);
        if (entries.length > 2000) {
          console.warn(
            `Directory ${currentPath} has ${entries.length} entries, limiting to 2000`
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
              entry.isDirectory()
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
      formatted: `Directory Statistics for ${dirPath}:
- Total Files: ${stats.totalFiles}
- Total Directories: ${stats.totalDirectories}
- Total Size: ${formatBytes(stats.totalSize)}
- Hidden Items: ${stats.hiddenItems}${
        includeHidden ? " (included)" : " (excluded)"
      }
- Ignored Items: ${stats.ignoredItems}${
        respectGitignore ? " (excluded)" : " (would be excluded)"
      }`,
      warning: undefined as string | undefined,
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
  includeProject: boolean = true
): Promise<EnvironmentInfo> {
  const cwd = workingDir || process.cwd();
  const result: EnvironmentInfo = {
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
        error: `Failed to read .chara.json: ${
          error instanceof Error ? error.message : String(error)
        }`,
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

    if (result.project) {
      result.project.files = projectFiles;
    }
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
      const envValue = process.env[key];
      if (envValue && result.environment) {
        result.environment[key] = envValue;
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
