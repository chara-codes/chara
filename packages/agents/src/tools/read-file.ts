import { tool } from "ai";
import z from "zod";

export const readFile = tool({
  description: "Read information from a file",
  parameters: z.object({
    path: z.string().describe("Path to a file"),
  }),
  execute: async ({ path }) => {
    const file = Bun.file(path);
    const text = await file.text();
    return text;
  },
});
