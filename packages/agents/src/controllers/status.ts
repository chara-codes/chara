import { logger } from "@apk/logger";
import { mcpWrapper } from "../mcp/mcp-client";
import { tools as localTools } from "../tools";

export const statusController = {
  getStatus: async () => {
    const mcpTools = mcpWrapper.getToolsSync();
    const allTools = { ...localTools, ...mcpTools };

    const toolsStatus = {
      total: Object.keys(allTools).length,
      local: {
        count: Object.keys(localTools).length,
        tools: Object.keys(localTools),
      },
      mcp: {
        isReady: mcpWrapper.isReady(),
        count: Object.keys(mcpTools).length,
        tools: Object.keys(mcpTools),
      },
    };

    logger.info("Status check:", toolsStatus);

    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      tools: toolsStatus,
    });
  },
};
