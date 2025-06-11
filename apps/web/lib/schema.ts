import { z } from "zod"

export const messageSchema = z.object({
  id: z.string(),
  content: z.string(),
  sender: z.enum(["user", "assistant"]),
  timestamp: z.date(),
  regenerations: z.array(z.string()).optional(),
  currentRegenerationIndex: z.number().optional(),
  fileChanges: z
    .array(
      z.object({
        id: z.string(),
        filename: z.string(),
        type: z.enum(["add", "delete", "modify"]),
        description: z.string(),
        version: z.number().optional(),
        diff: z
          .object({
            oldContent: z.string(),
            newContent: z.string(),
          })
          .optional(),
      }),
    )
    .optional(),
  commands: z
    .array(
      z.object({
        id: z.string(),
        command: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        size: z.number(),
        type: z.string(),
        url: z.string(),
      }),
    )
    .optional(),
})

export type MessageSchema = z.infer<typeof messageSchema>

