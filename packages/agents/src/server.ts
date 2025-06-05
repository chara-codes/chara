import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "@chara/logger";
import { chatAgent } from "./agents/chat-agent";
import { beautifyAgent } from "./agents/beautify-agent";
import { mcpWrapper } from "./mcp/mcp-client";

const app = new Hono();

app.use("*", cors());

// Chat endpoint
app.post("/api/chat", async (c) => {
  try {
    const { messages, model } = await c.req.json();

    const result = await chatAgent({
      model,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    logger.error("Chat endpoint error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Initialize MCP and start server
async function startServer() {
  logger.info("🚀 Starting agents server...");

  // Initialize MCP before starting server
  await mcpWrapper.initialize();

  const port = process.env.PORT || 3031;

  logger.info(`▶ Server started on port ${port}`);

  return {
    port: Number(port),
    fetch: app.fetch,
  };
}

export default startServer();
