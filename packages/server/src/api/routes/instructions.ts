import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { ee } from "../../utils/event-emitter";
import { logger } from "@chara-codes/logger";

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

export const instructionsRouter = router({
  reportResults: publicProcedure
    .input(instructionsResultSchema)
    .mutation(async ({ input }) => {
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

      return {
        received: true,
        timestamp: Date.now(),
      };
    }),
});
