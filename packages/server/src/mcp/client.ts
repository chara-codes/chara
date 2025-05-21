import { MCPClient } from "@mastra/mcp";

// Configure MCP client to connect to the server
export const mcp = new MCPClient({
  servers: {
    // Local server for agent communication
    agent: {
      url: new URL("http://localhost:3035/sse"),
      logger: (logMessage) => {
        console.log(`[Mastra MCP] ${logMessage.level}: ${logMessage.message}`);
      },
    },
  },
});
