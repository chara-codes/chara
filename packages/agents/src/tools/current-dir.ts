import { tool } from "ai";
import z from "zod";

export const currentDir = tool({
  description: "Show path to the current working directory",
  parameters: z.object({}),
  execute: async () => {
    return process.cwd();
  },
});
