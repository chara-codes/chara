import { tool } from "ai";
import z from "zod";

export const writeFile = tool({
  description: "Write data to the file, create folder if its not exists",
  parameters: z.object({
    path: z.string().describe("Path to a file"),
    content: z.string().describe("Content to write to the file"),
  }),
  execute: async ({ path, content }) => {
    await Bun.write(path, content);
    return { status: "success", savedFile: path };
  },
});
