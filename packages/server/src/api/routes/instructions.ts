import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { ee } from "../../utils/event-emitter";
import { streamText } from "ai";
import { nanoid } from "nanoid";
import { logger } from "@chara/logger";

// Define the schema for action results
const actionStatusSchema = z.enum(["success", "failure", "skipped"]);

const actionResultSchema = z.object({
  type: z.enum(["create", "update", "delete", "rename", "shell"]),
  target: z.string().optional(),
  status: actionStatusSchema,
  message: z.string(),
  error: z.string().optional(),
  command: z.string().optional(),
});

const instructionsResultSchema = z.object({
  actions: z.array(actionResultSchema),
  projectRoot: z.string(),
  success: z.boolean(),
  timestamp: z.number(),
});

// Modify the generateSummaryStream function to better handle streaming
async function generateSummaryStream(ctx: any, results: any) {
  const summaryId = nanoid(8);
  console.log(
    `[SUMMARY ${summaryId}] Starting summary generation for results:`,
    results.success ? "successful" : "failed",
    "execution",
  );

  const systemPrompt = `You are a helpful assistant that summarizes code changes.
Generate a concise, well-formatted markdown summary of the instruction execution results.
Focus on what files were changed, what the changes accomplished, and any errors encountered.

Your summary should include:
1. An overview section with success rate and types of changes
2. Sections for created, modified, and deleted files with brief descriptions
3. A summary of commands executed
4. Any errors or warnings that occurred
5. Use appropriate markdown formatting with headers, lists, and emojis where appropriate

Be concise but informative, focusing on helping the user understand what happened.`;

  // Format the results in a way that's easier for the LLM to understand
  const formattedResults = {
    success: results.success,
    projectRoot: results.projectRoot,
    actions: results.actions.map((action: any) => ({
      type: action.type,
      target: action.target || null,
      command: action.command || null,
      status: action.status,
      message: action.message,
      error: action.error || null,
    })),
    statistics: {
      total: results.actions.length,
      successful: results.actions.filter((a: any) => a.status === "success")
        .length,
      failed: results.actions.filter((a: any) => a.status === "failure").length,
      skipped: results.actions.filter((a: any) => a.status === "skipped")
        .length,
      byType: {
        create: results.actions.filter((a: any) => a.type === "create").length,
        update: results.actions.filter((a: any) => a.type === "update").length,
        delete: results.actions.filter((a: any) => a.type === "delete").length,
        rename: results.actions.filter((a: any) => a.type === "rename").length,
        shell: results.actions.filter((a: any) => a.type === "shell").length,
      },
    },
  };

  logger.dump(
    `[SUMMARY ${summaryId}] Formatted results for LLM:`,
    JSON.stringify(formattedResults, null, 2),
  );

  const { textStream } = streamText({
    model: ctx.ai(process.env.AI_MODEL || "gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: JSON.stringify(formattedResults),
      },
    ],
  });

  return textStream;
}

export const instructionsRouter = router({
  reportResults: publicProcedure
    .input(instructionsResultSchema)
    .mutation(async ({ ctx, input }) => {
      // Log the results
      logger.debug("Received instruction results", {
        success: input.success,
        actionCount: input.actions.length,
        successCount: input.actions.filter((a) => a.status === "success")
          .length,
        failureCount: input.actions.filter((a) => a.status === "failure")
          .length,
        timestamp: new Date(input.timestamp).toISOString(),
      });

      // Emit an event with the results
      ee.emit("instructions:results", input);

      // Generate a unique ID for this summary
      const summaryId = nanoid();

      try {
        const summaryStream = await generateSummaryStream(ctx, input);

        // Emit the summary stream event
        ee.emit("instructions:summary", {
          summaryId,
          stream: summaryStream,
          results: input,
        });

        return {
          received: true,
          summaryId,
          timestamp: Date.now(),
        };
      } catch (error) {
        logger.error(`Error generating summary: ${(error as Error).message}`);
        return {
          received: true,
          error: "Failed to generate summary",
          timestamp: Date.now(),
        };
      }
    }),
});
