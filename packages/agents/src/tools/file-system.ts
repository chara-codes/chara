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

export const fileSystem = tool({
  description: `Comprehensive file system management tool with multiple operations:

**Directory Operations:**
- **list**: Get a flat listing of files and directories with type indicators
- **tree**: Get a recursive tree structure as JSON with optional depth limit
- **create**: Create new directories (with recursive parent creation)
- **current**: Get the current working directory path
- **stats**: Get detailed statistics about directory contents
- **find**: Search for files and directories using glob patterns

**File Information:**
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
    action: FileSystemAction.describe("Operation to perform"),

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
      .describe("Glob pattern for find operation (e.g., '**/*.js', '*.txt')"),

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
  }) => {
    const workingPath = path || process.cwd();

    try {
      switch (action) {
        case "current":
          return {
            operation: "current",
            path: process.cwd(),
            absolutePath: resolve(process.cwd()),
          };

        case "create":
          if (!path) {
            throw new Error("Path is required for create operation");
          }
          await mkdir(path, { recursive: true });
          return {
            operation: "create",
            path: path,
            absolutePath: resolve(path),
            message: `Successfully created directory: ${path}`,
          };

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

        case "find":
          if (!pattern) {
            throw new Error("Pattern is required for find operation");
          }
          return await findInDirectory(
            workingPath,
            pattern,
            excludePatterns,
            includeHidden,
            respectGitignore,
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
            includeProject,
          );

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `File system operation '${action}' failed: ${errorMessage}`,
      );
    }
  },
});

async function listDirectory(
  dirPath: string,
  includeHidden: boolean,
  includeSize: boolean,
  respectGitignore: boolean,
) {
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

  for (const entry of entries) {
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

  return {
    operation: "list",
    path: dirPath,
    count: items.length,
    items,
    respectGitignore,
    formatted: formatted || "Directory is empty",
  };
}

async function getDirectoryTree(
  dirPath: string,
  maxDepth?: number,
  includeHidden: boolean = false,
  includeSize: boolean = false,
  respectGitignore: boolean = true,
  currentDepth: number = 0,
): Promise<any> {
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

      for (const entry of entries) {
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
          entryData.children = await buildTree(entryPath, depth + 1);
        }

        result.push(entryData);
      }

      return result;
    } catch (error) {
      throw new Error(
        `Failed to read directory ${currentPath}: ${error instanceof Error ? error.message : String(error)}`,
      );
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
}

async function getDirectoryStats(
  dirPath: string,
  includeHidden: boolean,
  respectGitignore: boolean,
) {
  const stats: DirectoryStats = {
    totalFiles: 0,
    totalDirectories: 0,
    totalSize: 0,
    hiddenItems: 0,
    ignoredItems: 0,
  };

  // Always create gitignore manager to count ignored items even when not respecting gitignore
  const gitignoreManager = await createGitignoreManager(dirPath);

  async function collectStats(currentPath: string) {
    try {
      const entries = await readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
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
          // Always recurse into directories to count ignored items, even if directory itself is ignored
          await collectStats(entryPath);

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

  return {
    operation: "stats",
    path: dirPath,
    respectGitignore,
    stats,
    formatted: `Directory Statistics:
- Files: ${stats.totalFiles}
- Directories: ${stats.totalDirectories}
- Total Size: ${formatBytes(stats.totalSize)}
- Hidden Items: ${stats.hiddenItems}${includeHidden ? " (included)" : " (excluded)"}
- Ignored Items: ${stats.ignoredItems}${respectGitignore ? " (excluded)" : " (would be excluded)"}`,
  };
}

async function findInDirectory(
  dirPath: string,
  pattern: string,
  excludePatterns: string[],
  includeHidden: boolean,
  respectGitignore: boolean,
) {
  const basePatterns = [pattern];
  const gitignoreManager = respectGitignore
    ? await createGitignoreManager(dirPath)
    : null;

  // Default exclusions (always applied regardless of gitignore setting)
  const defaultExclusions = [
    "!**/.chara/**",
    "!**/.git/**",
    "!**/node_modules/**",
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

  try {
    const files = await globby(allPatterns, {
      cwd: dirPath,
      onlyFiles: false, // Include both files and directories
      markDirectories: true,
      absolute: false,
      dot: includeHidden,
      followSymbolicLinks: false,
    });

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
