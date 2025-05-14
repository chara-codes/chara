import { publicProcedure, router } from "../trpc";
import { z } from "zod";
import path from "path";
import { handleProjectPreviewRequest } from "../../utils/preview/preview-manager";
import { getProjectsRoot } from "../../utils/file-utils";

export const previewRouter = router({
  start: publicProcedure
    .input(z.object({ projectName: z.string() }))
    .mutation(async ({ input }) => {
      const projectPath = path.join(getProjectsRoot(), input.projectName);
      const url = await handleProjectPreviewRequest(projectPath);
      return { url };
    }),
});
