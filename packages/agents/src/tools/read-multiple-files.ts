import { tool } from "ai";
import z from "zod";

export const readMultipleFiles = tool({
  description: "Read the contents of multiple files simultaneously",
  parameters: z.object({
    paths: z.array(z.string()).describe("Array of file paths to read"),
  }),
  execute: async ({ paths }) => {
    const results = await Promise.all(
      paths.map(async (filePath: string) => {
        try {
          const file = Bun.file(filePath);
          const content = await file.text();
          return `${filePath}:\n${content}\n`;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return `${filePath}: Error - ${errorMessage}`;
        }
      })
    );
    return results.join("\n---\n");
  },
});
