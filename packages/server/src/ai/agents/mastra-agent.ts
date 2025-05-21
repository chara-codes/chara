import { Agent } from "@mastra/core/agent";
import { anthropic } from "@ai-sdk/anthropic";
import { mcp } from "../../mcp/client";

// Configuration for Anthropic model
const MODEL_NAME = process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307";
const API_KEY = process.env.ANTHROPIC_API_KEY;

// Set API key for Anthropic
if (API_KEY) {
  process.env.ANTHROPIC_API_KEY = API_KEY;
} else {
  console.warn("ANTHROPIC_API_KEY is not set in environment variables");
}

// Create agent with Anthropic model and MCP tools
export const createAgent = async () => {
  // Create base agent configuration
  const agentConfig: any = {
    name: "Mastra AI Agent",
    instructions: "You are a helpful assistant.",
    model: anthropic(MODEL_NAME),
  };

  // Add MCP tools if MCP is available
  if (mcp) {
    try {
      // Get tools from MCP
      const tools = await mcp.getTools();
      agentConfig.tools = tools;
      console.log("MCP tools successfully added to the agent");
    } catch (error) {
      console.error("Error getting MCP tools:", error);
    }
  }

  // Create and return the agent
  return new Agent(agentConfig);
};

// Export agent as Promise
export const agentPromise = createAgent();

// For convenience, also export an async function to get the agent
export const getAgent = async () => {
  return await agentPromise;
};
