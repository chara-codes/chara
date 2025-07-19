import { tool } from "ai";
import { z } from "zod";
import { readdir, stat } from "fs/promises";
import { resolve, dirname, basename } from "path";
import walk from "ignore-walk";
import prettyBytes from "pretty-bytes";

interface TreeEntry {
  name: string;
  type: "file" | "directory";
  size?: number;
  children?: TreeEntry[];
}

const DEFAULT_IGNORE_PATTERNS = [
  "node_modules",
  ".git",
  ".chara",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "coverage",
  ".nyc_output",
];

function isAlwaysIgnored(fileName: string): boolean {
  return DEFAULT_IGNORE_PATTERNS.includes(fileName);
}

function isImportantHiddenFile(fileName: string): boolean {
  const important = [".gitignore", ".env", ".env.local", ".env.example"];
  return important.includes(fileName);
}

async function getIncludedPaths(
  dirPath: string,
  respectGitignore: boolean
): Promise<string[]> {
  if (!respectGitignore) {
    // Get all files when not respecting gitignore
    return await getAllPaths(dirPath);
  }

  try {
    const files = await walk({
      path: dirPath,
      ignoreFiles: [".gitignore", ".npmignore"],
      includeEmpty: true,
      follow: false,
    });

    // Add necessary parent directories
    const allPaths = new Set<string>();

    for (const file of files) {
      allPaths.add(file);

      // Add all parent directories
      let parentPath = dirname(file);
      while (parentPath !== "." && parentPath !== "/") {
        allPaths.add(parentPath);
        parentPath = dirname(parentPath);
      }
    }

    return Array.from(allPaths);
  } catch (error) {
    console.warn(
      `ignore-walk failed for ${dirPath}, falling back to all files:`,
      (error as Error).message || String(error)
    );
    return await getAllPaths(dirPath);
  }
}

async function getAllPaths(dirPath: string): Promise<string[]> {
  const paths: string[] = [];

  async function walkDir(currentPath: string, relativePath: string = "") {
    try {
      const entries = await readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = resolve(currentPath, entry.name);
        const relPath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;

        paths.push(relPath);

        if (entry.isDirectory()) {
          await walkDir(fullPath, relPath);
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  await walkDir(dirPath);
  return paths;
}

async function listDirectory(
  dirPath: string,
  includeHidden: boolean,
  includeSize: boolean,
  respectGitignore: boolean
): Promise<
  | {
      operation: string;
      path: string;
      count: number;
      items: Array<{
        name: string;
        type: "file" | "directory";
        size?: number;
        hidden: boolean;
        ignored?: boolean;
      }>;
      respectGitignore: boolean;
      formatted: string;
      warning?: string;
    }
  | {
      error: true;
      operation: string;
      path: string;
      message: string;
      technicalError: string;
    }
> {
  try {
    // Get all entries from the directory
    const entries = await readdir(dirPath, { withFileTypes: true });

    // Get included paths if respecting gitignore
    let includedPaths: string[] = [];
    if (respectGitignore) {
      includedPaths = await getIncludedPaths(dirPath, respectGitignore);
    }

    const items: Array<{
      name: string;
      type: "file" | "directory";
      size?: number;
      hidden: boolean;
      ignored?: boolean;
    }> = [];

    // Limit entries to prevent overflow
    const limitedEntries = entries.slice(0, 2000);
    let hasWarning = false;
    if (entries.length > 2000) {
      hasWarning = true;
      console.warn(
        `Directory ${dirPath} has ${entries.length} entries, limiting to 2000`
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

      // Check if file is included when respecting gitignore
      const isIgnoredByGit = respectGitignore
        ? !includedPaths.includes(entry.name)
        : false;

      if (respectGitignore && isIgnoredByGit) {
        continue;
      }

      const item: {
        name: string;
        type: "file" | "directory";
        size?: number;
        hidden: boolean;
        ignored?: boolean;
      } = {
        name: entry.name,
        type: entry.isDirectory() ? "directory" : "file",
        hidden: isHidden,
      };

      if (respectGitignore) {
        item.ignored = isIgnoredByGit;
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
          item.size !== undefined ? ` (${prettyBytes(item.size)})` : "";
        const hiddenIndicator = item.hidden ? " (hidden)" : "";
        const ignoredIndicator = item.ignored ? " (ignored)" : "";
        return `${typeIndicator} ${item.name}${sizeInfo}${hiddenIndicator}${ignoredIndicator}`;
      })
      .join("\n");

    const result: {
      operation: string;
      path: string;
      count: number;
      items: Array<{
        name: string;
        type: "file" | "directory";
        size?: number;
        hidden: boolean;
        ignored?: boolean;
      }>;
      respectGitignore: boolean;
      formatted: string;
      warning?: string;
    } = {
      operation: "list",
      path: dirPath,
      count: items.length,
      items,
      respectGitignore,
      formatted: formatted || "Directory is empty",
    };

    // Add warning if we hit the limit
    if (hasWarning) {
      result.warning = `Directory contains ${entries.length} entries, showing first 2000. Use 'find' action with patterns for more specific results.`;
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      error: true,
      operation: "list",
      path: dirPath,
      message: `Failed to list directory: ${errorMessage}`,
      technicalError: errorMessage,
    };
  }
}

async function buildTreeFromPaths(
  basePath: string,
  includedPaths: string[],
  includeSize: boolean
): Promise<TreeEntry[]> {
  const tree: TreeEntry[] = [];
  const pathMap = new Map<string, TreeEntry>();

  // Sort paths to ensure parents are processed before children
  const sortedPaths = includedPaths.sort();

  for (const path of sortedPaths) {
    const parts = path.split("/");
    const name = parts[parts.length - 1] || basename(path);
    const parentPath = parts.slice(0, -1).join("/");

    // Check if this path exists in the file system
    const fullPath = resolve(basePath, path);
    let isDirectory = false;
    let size: number | undefined;

    try {
      const stats = await stat(fullPath);
      isDirectory = stats.isDirectory();
      if (!isDirectory && includeSize) {
        size = stats.size;
      }
    } catch {
      // If we can't stat the file, skip it
      continue;
    }

    const entry: TreeEntry = {
      name,
      type: isDirectory ? "directory" : "file",
    };

    if (typeof size === "number") {
      entry.size = size;
    }

    if (isDirectory) {
      entry.children = [];
    }

    pathMap.set(path, entry);

    // Add to parent or root
    if (parentPath && parentPath !== "." && pathMap.has(parentPath)) {
      const parent = pathMap.get(parentPath);
      if (!parent) continue;
      if (parent.children) {
        parent.children.push(entry);
      }
    } else if (!parentPath || parentPath === ".") {
      tree.push(entry);
    }
  }

  return tree;
}

async function getDirectoryTree(
  dirPath: string,
  maxDepth?: number,
  includeHidden: boolean = false,
  includeSize: boolean = false,
  respectGitignore: boolean = true
): Promise<
  | {
      operation: string;
      path: string;
      maxDepth: number | string;
      includeHidden: boolean;
      includeSize: boolean;
      respectGitignore: boolean;
      tree: TreeEntry[];
      formatted: string;
    }
  | {
      error: true;
      operation: string;
      path: string;
      message: string;
      technicalError: string;
    }
> {
  try {
    // Get included paths
    let includedPaths = await getIncludedPaths(dirPath, respectGitignore);

    // Filter based on maxDepth
    if (maxDepth !== undefined) {
      includedPaths = includedPaths.filter((path) => {
        const depth = path.split("/").length - 1;
        return depth < maxDepth;
      });
    }

    // Filter based on hidden files
    if (!includeHidden) {
      includedPaths = includedPaths.filter((path) => {
        const parts = path.split("/");
        const hasHiddenPart = parts.some(
          (part) => part.startsWith(".") && !isImportantHiddenFile(part)
        );
        return !hasHiddenPart;
      });
    }

    // Filter out always ignored patterns
    includedPaths = includedPaths.filter((path) => {
      const parts = path.split("/");
      const hasIgnoredPart = parts.some((part) => isAlwaysIgnored(part));
      return !hasIgnoredPart;
    });

    const tree = await buildTreeFromPaths(dirPath, includedPaths, includeSize);

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
    return {
      error: true,
      operation: "tree",
      path: dirPath,
      message: `Failed to build directory tree: ${errorMessage}`,
      technicalError: errorMessage,
    };
  }
}

export const directory = tool({
  description: `Directory listing and tree visualization tool for exploring project structure:

**Operations:**
- **list**: Get a flat listing of files and directories with type indicators and optional file sizes
- **tree**: Get a recursive tree structure as JSON with optional depth limit and file sizes

**Features:**
- Full .gitignore support using ignore-walk package for accurate gitignore handling
- Automatic exclusion of .chara, node_modules, .git directories and common build/cache folders
- Support for hidden files and special characters
- Configurable depth limits for tree operations
- File size information where applicable
- Detailed error handling and validation
- Performance optimizations with entry limits to prevent system overload

**Use Cases:**
- Exploring project structure and organization
- Understanding directory hierarchy
- Analyzing file distribution
- Quick directory overview with file counts and sizes`,

  parameters: z.object({
    action: z.string().describe("Operation to perform: 'list' or 'tree'"),

    path: z
      .string()
      .optional()
      .describe("Directory path (defaults to current directory)"),

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

    respectGitignore: z
      .boolean()
      .default(true)
      .describe("Whether to respect .gitignore files (default: true)"),
  }),

  execute: async ({
    action,
    path,
    maxDepth,
    includeHidden = false,
    includeSize = false,
    respectGitignore = true,
  }) => {
    try {
      const workingPath = path || process.cwd();

      // Validate action
      const validActions = ["list", "tree"];
      if (!validActions.includes(action)) {
        return {
          error: true,
          suggestion: `Invalid action '${action}'. Valid actions are: ${validActions.join(
            ", "
          )}`,
          validActions,
          providedAction: action,
          message: "Invalid action provided. Please use 'list' or 'tree'.",
        };
      }

      // Safety checks for potentially problematic operations
      if (maxDepth && maxDepth > 10) {
        return {
          error: true,
          suggestion: `maxDepth of ${maxDepth} is too large. Please use a value between 1-10 to prevent system resource issues.`,
          message: "maxDepth too large",
          providedMaxDepth: maxDepth,
          recommendedMaxDepth: Math.min(maxDepth, 5),
        };
      }

      switch (action) {
        case "list": {
          const listResult = await listDirectory(
            workingPath,
            includeHidden,
            includeSize,
            respectGitignore
          );
          return listResult;
        }

        case "tree": {
          const treeResult = await getDirectoryTree(
            workingPath,
            maxDepth,
            includeHidden,
            includeSize,
            respectGitignore
          );
          return treeResult;
        }

        default:
          return {
            error: true,
            suggestion: `Invalid action '${action}'. Valid actions are: list, tree`,
            validActions: ["list", "tree"],
            providedAction: action,
            message: "Invalid action provided. Please use 'list' or 'tree'.",
          };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        error: true,
        message: `Directory tool error: ${errorMessage}`,
        technicalError: errorMessage,
      };
    }
  },
});
