import { logger } from "@chara-codes/logger";
import { isoGitService } from "../services/isogit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const gitController = {
  OPTIONS: () => new Response("", { headers: CORS_HEADERS }),

  async resetToCommit(req: Request) {
    try {
      const { commit } = await req.json() as { commit: string };

      if (!commit) {
        return Response.json(
          { error: "Commit hash is required" },
          {
            status: 400,
            headers: CORS_HEADERS
          }
        );
      }

      const workingDir = process.cwd();

      // Check if repository is initialized
      if (!(await isoGitService.isRepositoryInitialized(workingDir))) {
        return Response.json(
          { error: "Repository not initialized" },
          {
            status: 400,
            headers: CORS_HEADERS
          }
        );
      }

      // Reset to the specified commit
      await isoGitService.resetToCommit(workingDir, commit);

      logger.info(`Successfully reset to commit: ${commit}`);

      return Response.json(
        {
          success: true,
          message: `Reset to commit ${commit}`,
          commit
        },
        { headers: CORS_HEADERS }
      );

    } catch (error) {
      logger.error("Failed to reset to commit:", error);

      return Response.json(
        {
          error: "Failed to reset to commit",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        {
          status: 500,
          headers: CORS_HEADERS
        }
      );
    }
  },
};
