import { streamText } from "ai";
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { myAgent } from "../../ai/agents/my-agent";

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

export const chatRouter = router({
  streamText: publicProcedure
    .input(
      z.object({
        question: z.string(),
        project: z.object({ id: z.string(), name: z.string() }),
      }),
    )
    .query(async function* ({ ctx, input }) {
      const { textStream } = streamText({
        messages: [
          {
            role: "user",
            content: input.question,
          },
        ],
        model: ctx.ai(process.env.AI_MODEL || "gpt-4o-mini"),
      });
      console.log(
        "Chat streamText called with question:",
        input.question,
        input.project,
      );
      for await (const textPart of textStream) {
        yield textPart;
      }
    }),
  streamObject: publicProcedure
    .input(
      z.object({
        question: z.string(),
        project: z.object({ id: z.string(), name: z.string() }),
      }),
    )
    .query(async ({ ctx, input }) => {
      console.log(
        "Chat streamObject called with question:",
        input.question,
        input.project,
      );

      try {
        // Use myAgent directly to get the complete object
        const result = await myAgent(input.question, input.project);
        console.log("Received complete object from myAgent:", result);
        return result;
      } catch (error) {
        console.error("Error in streamObject:", error);
        throw error;
      }
    }),
});
