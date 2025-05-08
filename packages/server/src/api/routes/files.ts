import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { ee } from "../../utils/event-emitter";
import { myLogger as logger } from "../../utils/logger";

// Define the schema for file changes
const fileChangeSchema = z.object({
  path: z.string(),
  type: z.enum(["add", "modify", "delete"]),
  content: z.string().optional(),
  isDirectory: z.boolean(),
  timestamp: z.number(),
});

export type FileChange = z.infer<typeof fileChangeSchema>;

// Define the schema for project information
const projectInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
});

export type ProjectInfo = z.infer<typeof projectInfoSchema>;

export const filesRouter = router({
  // Sync file changes from CLI to UI
  syncChange: publicProcedure.input(fileChangeSchema).mutation(({ input }) => {
    try {
      // Emit the file change event to all connected clients
      ee.emit("fileChange", input);
      
      const changeType = input.isDirectory 
        ? `directory ${input.type}` 
        : `file ${input.type}`;
      
      logger.debug(`Synced ${changeType}: ${input.path}`);
      
      return {
        success: true,
        message: `Successfully synced ${input.path}`,
      };
    } catch (error) {
      logger.error(`Error syncing file change: ${error}`);
      return {
        success: false,
        message: `Failed to sync ${input.path}`,
      };
    }
  }),

  // Set the current project and send initial file structure
  setProject: publicProcedure.input(projectInfoSchema).mutation(({ input }) => {
    try {
      // Emit project selection event to all connected clients
      ee.emit("projectSelected", input);
      
      logger.info(`Project selected: ${input.name} (${input.id})`);
      
      return {
        success: true,
        message: `Project ${input.name} selected`,
      };
    } catch (error) {
      logger.error(`Error setting project: ${error}`);
      return {
        success: false,
        message: "Failed to set project",
      };
    }
  }),

  // Initial project structure upload
  syncProjectStructure: publicProcedure
    .input(z.array(fileChangeSchema))
    .mutation(({ input }) => {
      try {
        // Emit the project structure to all connected clients
        ee.emit("projectStructure", input);
        
        logger.info(`Synced project structure with ${input.length} items`);
        
        return {
          success: true,
          message: `Synced project structure with ${input.length} items`,
        };
      } catch (error) {
        logger.error(`Error syncing project structure: ${error}`);
        return {
          success: false,
          message: "Failed to sync project structure",
        };
      }
    }),
});