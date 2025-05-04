import { z } from "zod";

export const messageSchema = z.object({
  content: z
    .string()
    .describe(
      "Explanation of the changes and actions needed to be execute to implement the task (in markdown for better formatting)",
    ),
  commands: z
    .array(
      z.object({
        id: z.string().describe("Id command, use incremental numbers"),
        command: z.string().describe("Command to execute"),
        description: z.string().optional(),
      }),
    )
    .describe(
      "Array of commands that needs to be executed, ordered by priority",
    )
    .optional(),
  fileChanges: z
    .array(
      z.object({
        id: z.string().describe("File id, should include path and filename"),
        filename: z.string(),
        type: z.enum(["add", "delete", "modify"]).describe("Type of changes"),
        description: z.string().describe("Short description of the chages "),
        content: z.string().describe("File content that should be saved"),
      }),
    )
    .describe("List of files that should be changed")
    .optional(),
});

export type MessageSchema = z.infer<typeof messageSchema>;
