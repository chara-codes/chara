import { tool } from "ai";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";
import z from "zod";

const EditFileMode = z.enum(["edit", "create", "overwrite"]);

export const editFile = tool({
  description: `This is a tool for creating a new file or editing an existing file. For moving or renaming files, you should generally use the terminal tool with the 'mv' command instead.

Before using this tool:

1. Use the read_file tool to understand the file's contents and context

2. Verify the directory path is correct (only applicable when creating new files):
   - Use the list_directory tool to verify the parent directory exists and is the correct location`,

  parameters: z.object({
    display_description: z.string().describe(
      `A one-line, user-friendly markdown description of the edit. This will be shown in the UI and also passed to another model to perform the edit.

Be terse, but also descriptive in what you want to achieve with this edit. Avoid generic instructions.

NEVER mention the file path in this description.

<example>Fix API endpoint URLs</example>
<example>Update copyright year in page_footer</example>

Make sure to include this field before all the others in the input object so that we can display it immediately.`,
    ),

    path: z.string().describe(
      `The full path of the file to create or modify in the project.

WARNING: When specifying which file path need changing, you MUST start each path with one of the project's root directories.

The following examples assume we have two root directories in the project:
- backend
- frontend

<example>
backend/src/main.rs

Notice how the file path starts with root-1. Without that, the path would be ambiguous and the call would fail!
</example>

<example>
frontend/db.js
</example>`,
    ),

    mode: EditFileMode.describe(
      `The mode of operation on the file. Possible values:
- 'edit': Make granular edits to an existing file.
- 'create': Create a new file if it doesn't exist.
- 'overwrite': Replace the entire contents of an existing file.

When a file already exists or you just created it, prefer editing it as opposed to recreating it from scratch.`,
    ),

    content: z
      .string()
      .optional()
      .describe(
        "The new content for the file (required for 'create' and 'overwrite' modes)",
      ),

    edits: z
      .array(
        z.object({
          oldText: z
            .string()
            .describe("Text to search for - must match exactly"),
          newText: z.string().describe("Text to replace with"),
        }),
      )
      .optional()
      .describe("Array of edit operations to apply (required for 'edit' mode)"),
  }),

  execute: async ({ display_description, path, mode, content, edits }) => {
    try {
      // Validate inputs based on mode
      if (mode === "edit" && !edits) {
        throw new Error("'edits' parameter is required for edit mode");
      }

      if ((mode === "create" || mode === "overwrite") && !content) {
        throw new Error(
          "'content' parameter is required for create and overwrite modes",
        );
      }

      const fileExists = existsSync(path);

      // Validate file existence based on mode
      if (mode === "edit" && !fileExists) {
        throw new Error(`Cannot edit file: ${path} does not exist`);
      }

      if (mode === "create" && fileExists) {
        throw new Error(`Cannot create file: ${path} already exists`);
      }

      if (mode === "overwrite" && !fileExists) {
        throw new Error(`Cannot overwrite file: ${path} does not exist`);
      }

      let result: string;
      let operation: string;

      switch (mode) {
        case "create": {
          // Ensure parent directory exists
          const parentDir = dirname(path);
          if (!existsSync(parentDir)) {
            await mkdir(parentDir, { recursive: true });
          }

          await writeFile(path, content!, "utf8");
          result = `Created file ${path}`;
          operation = "created";
          break;
        }

        case "overwrite": {
          const originalContent = await readFile(path, "utf8");
          await writeFile(path, content!, "utf8");

          const diff = createDiff(originalContent, content!);
          result = `Overwrote file ${path}`;
          operation = "overwritten";

          return {
            status: "success",
            message: result,
            operation,
            path,
            diff: diff || "File completely replaced",
          };
        }

        case "edit": {
          const originalContent = await readFile(path, "utf8");
          let modifiedContent = originalContent;

          // Apply edits sequentially
          for (const edit of edits!) {
            const { oldText, newText } = edit;

            if (!modifiedContent.includes(oldText)) {
              // Try line-by-line matching with normalized whitespace
              const success = tryFlexibleMatch(
                modifiedContent,
                oldText,
                newText,
              );
              if (success.matched) {
                modifiedContent = success.content;
                continue;
              }

              throw new Error(
                `Could not find exact match for edit:\n${oldText}\n\nIn file: ${path}`,
              );
            }

            modifiedContent = modifiedContent.replaceAll(oldText, newText);
          }

          if (modifiedContent === originalContent) {
            return {
              status: "success",
              message: `No changes made to ${path}`,
              operation: "no-change",
              path,
              diff: "No changes",
            };
          }

          await writeFile(path, modifiedContent, "utf8");

          const diff = createDiff(originalContent, modifiedContent);
          result = `Successfully edited ${path}`;
          operation = "edited";

          return {
            status: "success",
            message: result,
            operation,
            path,
            diff: diff || "Changes applied",
          };
        }

        default:
          throw new Error(`Invalid mode: ${mode}`);
      }

      return {
        status: "success",
        message: result,
        operation,
        path,
      };
    } catch (error) {
      return {
        status: "error",
        message: `Failed to ${mode} file: ${error instanceof Error ? error.message : String(error)}`,
        operation: mode,
        path,
      };
    }
  },
});

function tryFlexibleMatch(
  content: string,
  oldText: string,
  newText: string,
): { matched: boolean; content: string } {
  const oldLines = oldText.split("\n");
  const contentLines = content.split("\n");

  for (let i = 0; i <= contentLines.length - oldLines.length; i++) {
    const potentialMatch = contentLines.slice(i, i + oldLines.length);

    // Compare lines with normalized whitespace
    const isMatch = oldLines.every((oldLine, j) => {
      const contentLine = potentialMatch[j];
      return contentLine !== undefined && oldLine.trim() === contentLine.trim();
    });

    if (isMatch) {
      // Preserve original indentation of first line
      const currentLine = contentLines[i];
      if (currentLine === undefined) continue;

      const originalIndent = currentLine.match(/^\s*/)?.[0] || "";
      const newLines = newText.split("\n").map((line, j) => {
        if (j === 0) return originalIndent + line.trimStart();

        // For subsequent lines, try to preserve relative indentation
        const oldIndent = oldLines[j]?.match(/^\s*/)?.[0] || "";
        const newIndent = line.match(/^\s*/)?.[0] || "";

        if (oldIndent && newIndent) {
          const relativeIndent = newIndent.length - oldIndent.length;
          return (
            originalIndent +
            " ".repeat(Math.max(0, relativeIndent)) +
            line.trimStart()
          );
        }
        return line;
      });

      contentLines.splice(i, oldLines.length, ...newLines);
      return { matched: true, content: contentLines.join("\n") };
    }
  }

  return { matched: false, content };
}

function createDiff(original: string, modified: string): string {
  const originalLines = original.split("\n");
  const modifiedLines = modified.split("\n");

  let diff = "";
  const maxLines = Math.max(originalLines.length, modifiedLines.length);

  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i] || "";
    const modLine = modifiedLines[i] || "";

    if (origLine !== modLine) {
      if (origLine) diff += `- ${origLine}\n`;
      if (modLine) diff += `+ ${modLine}\n`;
    }
  }

  return diff;
}
