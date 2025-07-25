import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { tool } from "ai";
import z from "zod";

export const editFile = tool({
  description: `This is a tool for making edits to existing files. For creating new files or completely overwriting files, use the write_file tool instead. For moving or renaming files, use the terminal tool with the 'mv' command.

Before using this tool:

1. Use the read_file tool to understand the file's contents and context
2. Ensure the file exists - this tool only works with existing files`,

  parameters: z.object({
    path: z.string().describe(
      `The relative path of the file to edit in the project.

WARNING: When specifying which file path need changing, you MUST
start each path with one of the project's root directories.

<example>
backend/src/main.rs
</example>

<example>
frontend/db.js
</example>`
    ),

    edits: z
      .array(
        z.object({
          oldText: z
            .string()
            .describe("Text to search for - must match exactly"),
          newText: z.string().describe("Text to replace with"),
        })
      )
      .describe("Array of edit operations to apply to the file"),
  }),

  execute: async ({ path, edits }) => {
    try {
      // Parse edits if it's a JSON string
      let parsedEdits: Array<{ oldText: string; newText: string }>;
      if (typeof edits === "string") {
        try {
          parsedEdits = JSON.parse(edits);
        } catch (parseError) {
          return {
            status: "error",
            message: `Invalid JSON in edits parameter: ${
              parseError instanceof Error
                ? parseError.message
                : String(parseError)
            }`,
            operation: "edit",
            path,
          };
        }
      } else {
        parsedEdits = edits!;
      }

      // Validate that edits are provided
      if (!parsedEdits || parsedEdits.length === 0) {
        return {
          status: "error",
          message:
            "'edits' parameter is required and must contain at least one edit",
          operation: "edit",
          path,
        };
      }

      const fileExists = existsSync(path);

      // Validate file exists
      if (!fileExists) {
        return {
          status: "error",
          message: `Cannot edit file: ${path} does not exist. Use write_file tool to create new files.`,
          operation: "edit",
          path,
        };
      }

      const originalContent = await readFile(path, "utf8");
      let modifiedContent = originalContent;

      // Apply edits sequentially
      for (const edit of parsedEdits) {
        const { oldText, newText } = edit;

        if (!modifiedContent.includes(oldText)) {
          // Try line-by-line matching with normalized whitespace
          const success = tryFlexibleMatch(modifiedContent, oldText, newText);
          if (success.matched) {
            modifiedContent = success.content;
            continue;
          }

          return {
            status: "error",
            message: `Could not find exact match for edit:\n${oldText}\n\nIn file: ${path}`,
            operation: "edit",
            path,
          };
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
      const result = `Successfully edited ${path}`;

      return {
        status: "success",
        message: result,
        operation: "edited",
        path,
        diff: diff || "Changes applied",
      };
    } catch (error) {
      return {
        status: "error",
        message: `Failed to edit file: ${
          error instanceof Error ? error.message : String(error)
        }`,
        operation: "edit",
        path,
      };
    }
  },
});

function tryFlexibleMatch(
  content: string,
  oldText: string,
  newText: string
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
