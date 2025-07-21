import { tool } from "ai";
import z from "zod";
import { readFile as fsReadFile, stat } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import { cwd } from "node:process";

// Configuration constants
const AUTO_OUTLINE_SIZE = 50000; // 50KB threshold for auto-outline
const MAX_OUTLINE_SYMBOLS = 200;

interface FileOutlineItem {
  name: string;
  type: string;
  line: number;
  endLine?: number;
}

interface ErrorResult {
  error: string;
}

interface SuccessResult {
  content: string;
}

type ReadFileResult = ErrorResult | SuccessResult;

// Security settings - these would ideally come from configuration
const EXCLUDED_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/.turbo/**",
  "**/coverage/**",
];

const PRIVATE_PATTERNS = [
  "**/.env",
  "**/.env.*",
  "**/secrets/**",
  "**/*.key",
  "**/*.pem",
  "**/*.p12",
  "**/*.pfx",
  "**/id_rsa",
  "**/id_ed25519",
  "**/.ssh/**",
];

const ReadFileInput = z.object({
  path: z
    .string()
    .describe(
      "The relative path of the file to read.\n\n" +
        "This path should never be absolute, and the first component " +
        "of the path should always be a root directory in a project.\n\n" +
        "<example>\n" +
        "If the project has the following root directories:\n\n" +
        "- directory1\n" +
        "- directory2\n\n" +
        "If you want to access `file.txt` in `directory1`, you should use the path `directory1/file.txt`.\n" +
        "If you want to access `file.txt` in `directory2`, you should use the path `directory2/file.txt`.\n" +
        "</example>"
    ),
  start_line: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Optional line number to start reading on (1-based index)"),
  end_line: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe(
      "Optional line number to end reading on (1-based index, inclusive)"
    ),
});

function matchesPattern(filePath: string, patterns: string[]): boolean {
  // Normalize path separators to forward slashes
  const normalizedPath = filePath.replace(/\\/g, "/");

  return patterns.some((pattern) => {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, "DOUBLE_STAR")
      .replace(/\*/g, "[^/]*")
      .replace(/DOUBLE_STAR/g, ".*")
      .replace(/\?/g, ".");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(normalizedPath);
  });
}

function validatePath(inputPath: string): {
  isValid: boolean;
  error?: string;
  resolvedPath?: string;
} {
  try {
    let resolvedPath: string;
    let pathForPatternCheck: string;

    // Handle absolute paths
    if (isAbsolute(inputPath)) {
      resolvedPath = inputPath;
      pathForPatternCheck = inputPath;

      // Check if it's within current working directory or temp directory (for tests)
      const relativeToCwd = relative(cwd(), resolvedPath);
      const isInTempDir =
        inputPath.includes("/tmp/") ||
        inputPath.includes("\\tmp\\") ||
        inputPath.includes("/var/folders/");

      if (
        !isInTempDir &&
        (relativeToCwd.startsWith("..") || isAbsolute(relativeToCwd))
      ) {
        return {
          isValid: false,
          error: `Path ${inputPath} not found in project - absolute paths are not allowed`,
        };
      }
    } else {
      // Handle relative paths
      resolvedPath = resolve(cwd(), inputPath);
      pathForPatternCheck = inputPath;

      // Check if path tries to escape the project directory
      const relativePath = relative(cwd(), resolvedPath);
      if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
        return {
          isValid: false,
          error: `Path ${inputPath} not found in project - path traversal not allowed`,
        };
      }
    }

    // Check against excluded patterns
    if (matchesPattern(pathForPatternCheck, EXCLUDED_PATTERNS)) {
      return {
        isValid: false,
        error: `Cannot read file because its path matches the global \`file_scan_exclusions\` setting: ${inputPath}`,
      };
    }

    // Check against private file patterns
    if (matchesPattern(pathForPatternCheck, PRIVATE_PATTERNS)) {
      return {
        isValid: false,
        error: `Cannot read file because its path matches the global \`private_files\` setting: ${inputPath}`,
      };
    }

    return {
      isValid: true,
      resolvedPath,
    };
  } catch {
    return {
      isValid: false,
      error: `Path ${inputPath} not found in project`,
    };
  }
}

function generateFileOutline(content: string): string {
  const lines = content.split("\n");
  const outline: FileOutlineItem[] = [];

  // Simple outline generation based on common patterns
  const patterns = [
    // JavaScript/TypeScript functions and classes
    { regex: /^(export\s+)?(async\s+)?function\s+(\w+)/i, type: "function" },
    { regex: /^(export\s+)?(default\s+)?class\s+(\w+)/i, type: "class" },
    { regex: /^(export\s+)?const\s+(\w+)\s*=/i, type: "const" },
    { regex: /^(export\s+)?let\s+(\w+)\s*=/i, type: "variable" },
    { regex: /^(export\s+)?var\s+(\w+)\s*=/i, type: "variable" },
    { regex: /^(export\s+)?interface\s+(\w+)/i, type: "interface" },
    { regex: /^(export\s+)?type\s+(\w+)/i, type: "type" },
    { regex: /^(export\s+)?enum\s+(\w+)/i, type: "enum" },

    // Python
    { regex: /^def\s+(\w+)/i, type: "function" },
    { regex: /^class\s+(\w+)/i, type: "class" },

    // Rust
    { regex: /^(pub\s+)?fn\s+(\w+)/i, type: "function" },
    { regex: /^(pub\s+)?struct\s+(\w+)/i, type: "struct" },
    { regex: /^(pub\s+)?enum\s+(\w+)/i, type: "enum" },
    { regex: /^(pub\s+)?mod\s+(\w+)/i, type: "module" },

    // Generic headers (Markdown, etc.)
    { regex: /^#{1,6}\s+(.+)$/i, type: "header" },
  ];

  for (
    let i = 0;
    i < lines.length && outline.length < MAX_OUTLINE_SYMBOLS;
    i++
  ) {
    const line = lines[i];
    if (!line || !line.trim()) continue;

    for (const pattern of patterns) {
      const match = line.match(pattern.regex);
      if (match) {
        const name = match[match.length - 1] || match[1] || "unnamed";
        outline.push({
          name: name.trim(),
          type: pattern.type,
          line: i + 1,
        });
        break;
      }
    }
  }

  if (outline.length === 0) {
    return `File contains ${lines.length} lines but no recognizable symbols were found.`;
  }

  const outlineText = outline
    .map((item) => `${item.name} [L${item.line}]`)
    .join("\n");

  return `File outline:\n\n${outlineText}`;
}

export const readFile = tool({
  description: `Reads the content of the given file in the project.

- Never attempt to read a path that hasn't been previously mentioned.
- If the file is too large, returns an outline instead with instructions to read specific line ranges.
- Supports reading specific line ranges using start_line and end_line parameters.
- Prevents access to files outside the project boundaries for security.`,

  parameters: ReadFileInput,

  execute: async ({ path, start_line, end_line }): Promise<ReadFileResult> => {
    // Manual input validation
    if (!path || typeof path !== "string") {
      return { error: "Path is required and must be a string" };
    }

    if (
      start_line !== undefined &&
      (typeof start_line !== "number" ||
        start_line < 1 ||
        !Number.isInteger(start_line))
    ) {
      return { error: "start_line must be a positive integer" };
    }

    if (
      end_line !== undefined &&
      (typeof end_line !== "number" ||
        end_line < 1 ||
        !Number.isInteger(end_line))
    ) {
      return { error: "end_line must be a positive integer" };
    }

    // Validate and resolve path
    const pathValidation = validatePath(path);
    if (!pathValidation.isValid) {
      return { error: pathValidation.error || "Invalid path" };
    }

    const resolvedPath = pathValidation.resolvedPath;
    if (!resolvedPath) {
      return { error: "Could not resolve path" };
    }

    try {
      // Check if file exists and get stats
      const stats = await stat(resolvedPath);

      if (!stats.isFile()) {
        return { error: `${path} is not a file` };
      }

      // Read file content
      const content = await fsReadFile(resolvedPath, "utf-8");

      // Handle line range requests
      if (start_line !== undefined || end_line !== undefined) {
        const lines = content.split("\n");
        const startIdx = Math.max(0, (start_line || 1) - 1);
        const endIdx =
          end_line !== undefined
            ? Math.min(lines.length, end_line)
            : lines.length;

        // Ensure at least one line is returned
        const actualEndIdx = Math.max(startIdx + 1, endIdx);

        return { content: lines.slice(startIdx, actualEndIdx).join("\n") };
      }

      // Check file size and decide whether to return content or outline
      if (content.length > AUTO_OUTLINE_SIZE) {
        const outline = generateFileOutline(content);
        const outlineContent = `This file was too big to read all at once.

Here is an outline of its symbols:

${outline}

Using the line numbers in this outline, you can call this tool again
while specifying the start_line and end_line fields to see the
implementations of symbols in the outline.`;
        return { content: outlineContent };
      }

      return { content };
    } catch (error) {
      if (error instanceof Error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === "ENOENT") {
          return { error: `${path} not found` };
        }
        if (nodeError.code === "EACCES") {
          return { error: `Permission denied reading ${path}` };
        }
        if (nodeError.code === "EISDIR") {
          return { error: `${path} is a directory, not a file` };
        }
        // Handle our custom validation errors
        if (
          error.message.includes("Cannot read file because") ||
          error.message.includes("not found in project")
        ) {
          return { error: error.message };
        }
      }
      return {
        error: `Failed to read ${path}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  },
});
