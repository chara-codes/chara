import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";
import { tool } from "ai";
import z from "zod";

export const editFile = tool({
  description: `This is a tool for making edits to existing files. For moving or renaming files, use the terminal tool with the 'mv' command. For creating new files use 'write-file' tool.

This tool replaces text within a file by finding an exact match for the old_string and replacing it with new_string. For precise targeting, include sufficient context around the change.

Requirements:
1. old_string MUST be the exact literal text to replace (including all whitespace, indentation, newlines)
2. new_string MUST be the exact literal text to replace old_string with
3. For single replacements, include at least 3 lines of context BEFORE and AFTER the target text
4. Match whitespace and indentation precisely
5. Use empty old_string to create a new file

Before using this tool, use the read_file tool to examine the file's current content.`,

  inputSchema: z.object({
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

    old_string: z.string().describe(
      `The exact literal text to replace. Must match exactly including whitespace and indentation.
For new files, use an empty string.
For edits, include sufficient context (3+ lines before and after) to uniquely identify the location.`
    ),

    new_string: z.string().describe(
      `The exact literal text to replace old_string with.
Ensure the resulting code is correct and properly indented.`
    ),

    expected_occurrences: z
      .number()
      .optional()
      .describe(
        `Number of occurrences expected to be replaced. Defaults to 1.
Use when you want to replace multiple occurrences of the same text.`
      ),
  }),

  execute: async ({
    path,
    old_string,
    new_string,
    expected_occurrences = 1,
  }) => {
    try {
      const isNewFile = old_string === "";
      let currentContent: string | null = null;
      let fileExists = false;

      // Check if file exists and read content
      try {
        if (existsSync(path)) {
          currentContent = await readFile(path, "utf8");
          // Normalize line endings to LF for consistent processing
          currentContent = currentContent.replace(/\r\n/g, "\n");
          fileExists = true;
        }
      } catch (error) {
        return {
          status: "error",
          message: `Failed to read file: ${
            error instanceof Error ? error.message : String(error)
          }`,
          operation: "read",
          path,
        };
      }

      // Handle new file creation
      if (isNewFile && !fileExists) {
        try {
          // Ensure parent directories exist
          await mkdir(dirname(path), { recursive: true });
          await writeFile(path, new_string, "utf8");

          return {
            status: "success",
            message: `Successfully created new file: ${path}`,
            operation: "created",
            path,
            diff: `+ ${new_string.split("\n").length} lines added`,
          };
        } catch (error) {
          return {
            status: "error",
            message: `Failed to create file: ${
              error instanceof Error ? error.message : String(error)
            }`,
            operation: "create",
            path,
          };
        }
      }

      // Handle attempt to create file that already exists
      if (isNewFile && fileExists) {
        return {
          status: "error",
          message: `Cannot create file: ${path} already exists. Use non-empty old_string to edit existing files.`,
          operation: "create",
          path,
        };
      }

      // Handle editing non-existent file
      if (!isNewFile && !fileExists) {
        return {
          status: "error",
          message: `Cannot edit file: ${path} does not exist. Use empty old_string to create new files.`,
          operation: "edit",
          path,
        };
      }

      // At this point we're editing an existing file
      if (currentContent === null) {
        return {
          status: "error",
          message: `Failed to read content of existing file: ${path}`,
          operation: "edit",
          path,
        };
      }

      // Check for exact matches
      const occurrences = countOccurrences(currentContent, old_string);

      if (occurrences === 0) {
        // Try flexible matching with whitespace normalization
        const flexibleResult = tryFlexibleReplace(
          currentContent,
          old_string,
          new_string
        );

        if (flexibleResult.success) {
          const newContent = flexibleResult.content;

          if (newContent === currentContent) {
            return {
              status: "success",
              message: `No changes made to ${path} - content is identical`,
              operation: "no-change",
              path,
              diff: "No changes",
            };
          }

          await writeFile(path, newContent, "utf8");
          const diff = createDiff(currentContent, newContent);

          return {
            status: "success",
            message: `Successfully edited ${path} (flexible matching applied)`,
            operation: "edited",
            path,
            diff: diff || "Changes applied",
          };
        }

        return {
          status: "error",
          message: `Could not find exact match for old_string in ${path}:\n${old_string}\n\nThe text may not exist or may have different whitespace/indentation. Use read_file to verify the current content.`,
          operation: "edit",
          path,
          suggestion:
            "Include more context lines around the target text and ensure exact whitespace matching.",
        };
      }

      if (occurrences !== expected_occurrences) {
        return {
          status: "error",
          message: `Expected ${expected_occurrences} occurrence(s) but found ${occurrences} in ${path}`,
          operation: "edit",
          path,
          suggestion:
            occurrences > expected_occurrences
              ? "Add more context to old_string to make it more specific"
              : "Check if the text exists or adjust expected_occurrences",
        };
      }

      // Check if old_string and new_string are identical
      if (old_string === new_string) {
        return {
          status: "success",
          message: `No changes made to ${path} - old_string and new_string are identical`,
          operation: "no-change",
          path,
          diff: "No changes",
        };
      }

      // Apply the replacement
      const newContent = currentContent.replaceAll(old_string, new_string);

      if (newContent === currentContent) {
        return {
          status: "success",
          message: `No changes made to ${path} - content is identical after replacement`,
          operation: "no-change",
          path,
          diff: "No changes",
        };
      }

      // Write the modified content
      await writeFile(path, newContent, "utf8");
      const diff = createDiff(currentContent, newContent);

      return {
        status: "success",
        message: `Successfully edited ${path} (${occurrences} replacement(s))`,
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

function countOccurrences(content: string, searchString: string): number {
  if (searchString === "") return 0;
  return content.split(searchString).length - 1;
}

function tryFlexibleReplace(
  content: string,
  oldText: string,
  newText: string
): { success: boolean; content: string } {
  if (oldText === "") return { success: false, content };

  const contentLines = content.split("\n");
  const oldLines = oldText.split("\n");

  for (let i = 0; i <= contentLines.length - oldLines.length; i++) {
    const potentialMatch = contentLines.slice(i, i + oldLines.length);

    // Compare lines with normalized whitespace
    const isMatch = oldLines.every((oldLine, j) => {
      const contentLine = potentialMatch[j];
      if (contentLine === undefined) return false;

      // Normalize whitespace for comparison
      const normalizedOld = oldLine.trim();
      const normalizedContent = contentLine.trim();

      return normalizedOld === normalizedContent;
    });

    if (isMatch) {
      // Preserve original indentation of the first line
      const firstContentLine = contentLines[i];
      if (firstContentLine === undefined) continue;

      const originalIndent = firstContentLine.match(/^\s*/)?.[0] || "";
      const newLines = newText.split("\n");

      // Apply original indentation to new lines
      const indentedNewLines = newLines.map((line, index) => {
        if (index === 0) {
          return originalIndent + line.trimStart();
        }

        // For subsequent lines, preserve relative indentation from original context
        const oldLineIndent = oldLines[index]?.match(/^\s*/)?.[0] || "";
        const newLineIndent = line.match(/^\s*/)?.[0] || "";

        if (oldLines[index] !== undefined) {
          // Calculate the relative indentation difference
          const baseIndentLevel = oldLines[0]?.match(/^\s*/)?.[0]?.length || 0;
          const currentOldIndentLevel = oldLineIndent.length;
          const relativeIndent = currentOldIndentLevel - baseIndentLevel;

          // Apply the same relative indentation to the new line
          const targetIndent = originalIndent.length + relativeIndent;
          return " ".repeat(Math.max(0, targetIndent)) + line.trimStart();
        }

        // For new lines beyond the original pattern, maintain the same indent as the replacement context
        return originalIndent + line.trimStart();
      });

      // Replace the matched lines
      contentLines.splice(i, oldLines.length, ...indentedNewLines);
      return { success: true, content: contentLines.join("\n") };
    }
  }

  return { success: false, content };
}

function createDiff(original: string, modified: string): string {
  const originalLines = original.split("\n");
  const modifiedLines = modified.split("\n");

  const maxLines = Math.max(originalLines.length, modifiedLines.length);
  const diffLines: string[] = [];

  let addedLines = 0;
  let removedLines = 0;

  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i];
    const modLine = modifiedLines[i];

    if (origLine !== modLine) {
      if (origLine !== undefined) {
        diffLines.push(`- ${origLine}`);
        removedLines++;
      }
      if (modLine !== undefined) {
        diffLines.push(`+ ${modLine}`);
        addedLines++;
      }
    }
  }

  if (diffLines.length === 0) {
    return "No changes";
  }

  const summary = `Changes: +${addedLines} -${removedLines} lines\n`;
  return summary + diffLines.join("\n");
}
