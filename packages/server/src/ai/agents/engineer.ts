import { streamObject } from "ai";
import { aiProvider } from "../ai";
import { z } from "zod";

export const messageSchema = z.object({
  content: z
    .string()
    .describe(
      "Explanation of the changes and actions needed to be execute to implement the task (in markdown for better formatting)",
    ),
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
  commands: z
    .array(
      z.object({
        command: z.string().describe("Command to execute"),
        description: z.string().optional(),
      }),
    )
    .describe(
      "Array of commands that needs to be executed, ordered by priority",
    )
    .optional(),
});

export const engineerAgent = async function* (task: string) {
  const { partialObjectStream } = streamObject({
    model: aiProvider(process.env.AI_MODEL || "gpt-4o-mini"),
    schema: messageSchema,
    messages: [
      {
        role: "system",
        content:
          "You are expirienced software engineer and need to analyze the request and suggest the solution. The solution should include the list of files that should be changed, commands that needs to be executed and the explanation of the changes and actions needed to be execute to implement the task.",
      },
      {
        role: "user",
        content: task || "test test test",
      },
    ],
  });

  for await (const partialObject of partialObjectStream) {
    console.log("Obj:", partialObject);
    yield partialObject;
  }
};
