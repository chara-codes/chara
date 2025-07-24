import { getMcpClientStatus } from "../mcp/mcp-servers";

export const statusController = {
  getStatus: async () => {
    const mcpStatus = getMcpClientStatus();

    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      mcp: {
        status: mcpStatus.initializationState,
        connected_clients: mcpStatus.connectedClients,
      },
    });
  },
};
