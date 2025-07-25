import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { dirname } from "path";
import { tool } from "ai";
import z from "zod";

export const writeFile = tool({
  description: `Writes content to a specified file in the local filesystem. Automatically creates new files or overwrites existing ones.

Use this tool when you need to:
- Create a new file with content
- Completely replace the contents of an existing file

For making granular edits to existing files, use the edit-file tool instead.`,

  parameters: z.object({
    path: z.string().describe(
      `The relative path of the file to create or overwrite in the project.

WARNING: When specifying which file path need changing, you MUST start each path with one of the project's root directories.

The following examples assume we have two root directories in the project:
- backend
- frontend

<example>
backend/src/config.ts

Notice how the file path starts with backend. Without that, the path would be ambiguous and the call would fail!
</example>

<example>
frontend/components/Button.tsx
</example>`
    ),

    content: z
      .string()
      .describe(
        "The complete content to write to the file. This will be the entire file content after the operation."
      ),
  }),

  execute: async (options) => {
    const { path, content } = options;
    try {
      const fileExists = existsSync(path);
      const isNewFile = !fileExists;

      // Ensure parent directory exists
      const parentDir = dirname(path);
      if (!existsSync(parentDir)) {
        await mkdir(parentDir, { recursive: true });
      }

      await Bun.write(path, content);

      const result = isNewFile
        ? `Created file ${path}`
        : `Overwrote file ${path}`;
      const operation = isNewFile ? "created" : "overwritten";

      return {
        status: "success",
        message: result,
        operation,
        path,
        contentLength: content.length,
        isNewFile,
      };
    } catch (error) {
      return {
        status: "error",
        message: `Failed to write file: ${
          error instanceof Error ? error.message : String(error)
        }`,
        operation: "write",
        path,
      };
    }
  },
});
