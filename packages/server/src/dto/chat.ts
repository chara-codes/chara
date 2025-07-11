import { z } from "zod";

export const messageSchema = z.object({
  content: z
    .string()
    .describe(
      "Explanation of the changes and actions needed to be execute to implement the task (in markdown for better formatting)"
    ),
});

export type MessageSchema = z.infer<typeof messageSchema>;
