import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { FileContentService } from "../../services/fileContentService";
import { FileListingService } from "../../services/fileListingService";
import { logger } from "../../utils/logger";
import { publicProcedure, router } from "../trpc";

/**
 * Context router for file listing and content retrieval
 * Used by the context dropdown to display and select files
 */
export const contextRouter = router({
  /**
   * Get file listing for context dropdown
   * Scans the current working directory and returns a tree of files
   */
  getFileList: publicProcedure
    .input(
      z.object({
        maxDepth: z.number().min(1).max(10).optional().default(3),
        includeHidden: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      try {
        const workingDirectory = process.cwd();
        logger.debug("Getting file list for context dropdown", {
          workingDirectory,
          maxDepth: input.maxDepth,
          includeHidden: input.includeHidden,
        });

        const fileListingService = new FileListingService(workingDirectory);
        const result = await fileListingService.listFiles({
          maxDepth: input.maxDepth,
          includeHidden: input.includeHidden,
          workingDirectory,
        });

        return result;
      } catch (error) {
        logger.error("Failed to get file list", { error });

        // Handle specific error cases
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Working directory not found",
          });
        }

        if ((error as NodeJS.ErrnoException).code === "EACCES") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Permission denied reading directory",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list files",
          cause: error,
        });
      }
    }),

  /**
   * Get file content for context
   * Retrieves the content of a specific file by path
   */
  getFileContent: publicProcedure
    .input(
      z.object({
        filePath: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const workingDirectory = process.cwd();
        logger.debug("Getting file content for context", {
          filePath: input.filePath,
          workingDirectory,
        });

        const fileContentService = new FileContentService(workingDirectory);
        const result = await fileContentService.getFileContent(input.filePath);

        return result;
      } catch (error) {
        logger.error("Failed to get file content", {
          filePath: input.filePath,
          error,
        });

        // Handle specific error cases
        const errorMessage = (error as Error).message;

        if (errorMessage.includes("File not found")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `File not found: ${input.filePath}`,
          });
        }

        if (errorMessage.includes("Permission denied")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Permission denied: ${input.filePath}`,
          });
        }

        if (errorMessage.includes("File too large")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: errorMessage,
          });
        }

        if (errorMessage.includes("outside working directory")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid file path: path is outside working directory",
          });
        }

        if (errorMessage.includes("not a file")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Path is not a file",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to read file content",
          cause: error,
        });
      }
    }),
});
