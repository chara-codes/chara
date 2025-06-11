import { tool } from "ai";
import z from "zod";

const EditOperation = z.object({
  oldText: z.string().describe("Text to search for - must match exactly"),
  newText: z.string().describe("Text to replace with"),
});

export const editFile = tool({
  description:
    "Make line-based edits to a text file by replacing exact text matches",
  parameters: z.object({
    path: z.string().describe("Path to the file to edit"),
    edits: z.array(EditOperation).describe("Array of edit operations to apply"),
    dryRun: z
      .boolean()
      .default(false)
      .describe("Preview changes without writing to file"),
  }),
  execute: async ({ path, edits, dryRun = false }) => {
    // Read file content
    const file = Bun.file(path);
    const content = await file.text();

    // Normalize line endings
    const normalizeLineEndings = (text: string): string => {
      return text.replace(/\r\n/g, "\n");
    };

    const normalizedContent = normalizeLineEndings(content);

    // Apply edits sequentially
    let modifiedContent = normalizedContent;
    for (const edit of edits) {
      const normalizedOld = normalizeLineEndings(edit.oldText);
      const normalizedNew = normalizeLineEndings(edit.newText);

      // Check if exact match exists
      if (modifiedContent.includes(normalizedOld)) {
        modifiedContent = modifiedContent.replaceAll(
          normalizedOld,
          normalizedNew,
        );
        continue;
      }

      // Try line-by-line matching with flexibility for whitespace
      const oldLines = normalizedOld.split("\n");
      const contentLines = modifiedContent.split("\n");
      let matchFound = false;

      for (let i = 0; i <= contentLines.length - oldLines.length; i++) {
        const potentialMatch = contentLines.slice(i, i + oldLines.length);

        // Compare lines with normalized whitespace
        const isMatch = oldLines.every((oldLine, j) => {
          const contentLine = potentialMatch[j];
          return (
            contentLine !== undefined && oldLine.trim() === contentLine.trim()
          );
        });

        if (isMatch) {
          // Preserve original indentation of first line
          const currentLine = contentLines[i];
          if (currentLine === undefined) continue;

          const originalIndent = currentLine.match(/^\s*/)?.[0] || "";
          const newLines = normalizedNew.split("\n").map((line, j) => {
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
          modifiedContent = contentLines.join("\n");
          matchFound = true;
          break;
        }
      }

      if (!matchFound) {
        throw new Error(
          `Could not find exact match for edit:\n${edit.oldText}`,
        );
      }
    }

    // Create a simple diff representation
    const createDiff = (original: string, modified: string): string => {
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
    };

    const diff = createDiff(normalizedContent, modifiedContent);

    if (!dryRun) {
      await Bun.write(path, modifiedContent);
      return {
        status: "success",
        message: `Successfully edited ${path}`,
        diff: diff || "No changes made",
      };
    }

    return {
      status: "preview",
      message: `Preview of changes to ${path}`,
      diff: diff || "No changes would be made",
    };
  },
});
