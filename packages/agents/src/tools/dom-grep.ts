import { tool } from "ai";
import z from "zod";

export const domGrep = tool({
  description: `Find element on the page`,

  inputSchema: z.object({
    url: z
      .string()
      .optional()
      .describe("Page url, by default used development server url"),
    selector: z.string().describe("The css selector"),
    condition: z
      .record(z.string(), z.string())
      .optional()
      .describe(
        "The optional list of conditions that should be applicable on selected elements e.g. {'color': 'green'} or {'heigth': '~100px'}"
      ),
  }),
});
