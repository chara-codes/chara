import { tool } from "ai";
import z from "zod";
import { readdir, mkdir, stat } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { globby } from "globby";

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
}

const DirectoryAction = z.enum([
  "list",
  "tree",
  "create",
  "current",
  "stats",
  "find"
]);

export const directory = tool({
  description: `Comprehensive directory management tool with multiple operations:

**Operations:**
- **list**: Get a flat listing of files and directories with type indicators
- **tree**: Get a recursive tree structure as JSON with optional depth limit
- **create**: Create new directories (with recursive parent creation)
- **current**: Get the current working directory path
- **stats**: Get detailed statistics about directory contents
- **find**: Search for files and directories using glob patterns

**Features:**
- Automatic exclusion of .chara directories and common build/cache folders
- Support for hidden files and special characters
- Configurable depth limits for tree operations
- File size information where applicable
- Glob pattern matching for powerful file finding
- Detailed error handling and validation`,

  parameters: z.object({
    action: DirectoryAction.describe("Operation to perform on the directory"),

    path: z
      .string()
      .optional()
      .describe("Directory path (defaults to current directory for most operations, required for create)"),

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
      .describe("Glob patterns to exclude from results"),
  }),

  execute: async ({
    action,
    path,
    maxDepth,
    includeHidden = false,
    includeSize = false,
    pattern,
    excludePatterns = []
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
          return await listDirectory(workingPath, includeHidden, includeSize);

        case "tree":
          return await getDirectoryTree(workingPath, maxDepth, includeHidden, includeSize);

        case "stats":
          return await getDirectoryStats(workingPath, includeHidden);

        case "find":
          if (!pattern) {
            throw new Error("Pattern is required for find operation");
          }
          return await findInDirectory(workingPath, pattern, excludePatterns, includeHidden);

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Directory operation '${action}' failed: ${errorMessage}`);
    }
  },
});

async function listDirectory(
  dirPath: string,
  includeHidden: boolean,
  includeSize: boolean
) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const items: Array<{
    name: string;
    type: "file" | "directory";
    size?: number;
    hidden: boolean;
  }> = [];

  for (const entry of entries) {
    const isHidden = entry.name.startsWith(".");
    const isCharaDir = entry.name.startsWith(".chara");

    // Skip .chara directories and hidden files if not requested
    if (isCharaDir || (!includeHidden && isHidden)) {
      continue;
    }

    const item: any = {
      name: entry.name,
      type: entry.isDirectory() ? "directory" : "file",
      hidden: isHidden,
    };

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
    .map(item => {
      const typeIndicator = item.type === "directory" ? "[DIR]" : "[FILE]";
      const sizeInfo = item.size !== undefined ? ` (${formatBytes(item.size)})` : "";
      const hiddenIndicator = item.hidden ? " (hidden)" : "";
      return `${typeIndicator} ${item.name}${sizeInfo}${hiddenIndicator}`;
    })
    .join("\n");

  return {
    operation: "list",
    path: dirPath,
    count: items.length,
    items,
    formatted: formatted || "Directory is empty",
  };
}

async function getDirectoryTree(
  dirPath: string,
  maxDepth?: number,
  includeHidden: boolean = false,
  includeSize: boolean = false,
  currentDepth: number = 0
): Promise<any> {

  async function buildTree(currentPath: string, depth: number = 0): Promise<TreeEntry[]> {
    if (maxDepth !== undefined && depth >= maxDepth) {
      return [];
    }

    try {
      const entries = await readdir(currentPath, { withFileTypes: true });
      const result: TreeEntry[] = [];

      for (const entry of entries) {
        const isHidden = entry.name.startsWith(".");
        const isCharaDir = entry.name.startsWith(".chara");

        // Skip .chara directories and hidden files if not requested
        if (isCharaDir || (!includeHidden && isHidden)) {
          continue;
        }

        const entryPath = resolve(currentPath, entry.name);
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
        `Failed to read directory ${currentPath}: ${error instanceof Error ? error.message : String(error)}`
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
    tree,
    formatted: JSON.stringify(tree, null, 2),
  };
}

async function getDirectoryStats(dirPath: string, includeHidden: boolean) {
  const stats: DirectoryStats = {
    totalFiles: 0,
    totalDirectories: 0,
    totalSize: 0,
    hiddenItems: 0,
  };

  async function collectStats(currentPath: string) {
    try {
      const entries = await readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const isHidden = entry.name.startsWith(".");
        const isCharaDir = entry.name.startsWith(".chara");

        if (isCharaDir) continue;

        if (isHidden) {
          stats.hiddenItems++;
          if (!includeHidden) continue;
        }

        const entryPath = resolve(currentPath, entry.name);

        if (entry.isDirectory()) {
          stats.totalDirectories++;
          await collectStats(entryPath);
        } else {
          stats.totalFiles++;
          try {
            const fileStat = await stat(entryPath);
            stats.totalSize += fileStat.size;
          } catch {
            // Skip if can't read file stats
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
    stats,
    formatted: `Directory Statistics:
- Files: ${stats.totalFiles}
- Directories: ${stats.totalDirectories}
- Total Size: ${formatBytes(stats.totalSize)}
- Hidden Items: ${stats.hiddenItems}${includeHidden ? " (included)" : " (excluded)"}`,
  };
}

async function findInDirectory(
  dirPath: string,
  pattern: string,
  excludePatterns: string[],
  includeHidden: boolean
) {
  const basePatterns = [pattern];

  // Default exclusions
  const defaultExclusions = [
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
  ];

  // Add user exclusions
  const userExclusions = excludePatterns.map(p => p.startsWith("!") ? p : `!${p}`);

  // Hidden files exclusion
  const hiddenExclusions = includeHidden ? [] : ["!**/.*"];

  const allPatterns = [
    ...basePatterns,
    ...defaultExclusions,
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

    const results = files.map(file => {
      const isDirectory = file.endsWith("/");
      return {
        path: isDirectory ? file.slice(0, -1) : file,
        type: isDirectory ? "directory" : "file",
        relativePath: file,
        absolutePath: resolve(dirPath, isDirectory ? file.slice(0, -1) : file),
      };
    });

    return {
      operation: "find",
      searchPath: dirPath,
      pattern,
      excludePatterns,
      includeHidden,
      count: results.length,
      results,
      formatted: results.length > 0
        ? results.map(r => `${r.type === "directory" ? "[DIR]" : "[FILE]"} ${r.path}`).join("\n")
        : "No matches found",
    };
  } catch (error) {
    throw new Error(`Find operation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
