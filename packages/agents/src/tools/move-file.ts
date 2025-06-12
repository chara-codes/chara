import { tool } from "ai";
import z from "zod";
import { rename } from "node:fs/promises";

export const moveFile = tool({
  description:
    "Move or rename files and directories. Can move files between directories and rename them in a single operation.",
  parameters: z.object({
    source: z.string().describe("Source path of the file or directory to move"),
    destination: z
      .string()
      .describe(
        "Destination path where the file or directory should be moved to",
      ),
  }),
  execute: async ({ source, destination }) => {
    try {
      await rename(source, destination);

      return {
        status: "success",
        message: `Successfully moved ${source} to ${destination}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to move ${source} to ${destination}: ${errorMessage}`,
      );
    }
  },
});
