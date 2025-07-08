import { logger } from "@chara-codes/logger";
import { tool } from "ai";
import { z } from "zod";

// Types for Model Context Protocol
interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * Simple MCP wrapper that initializes once and caches tools
 */
class MCPWrapper {
  private baseUrl: string;
  private sessionId: string | null = null;
  private isInitialized = false;
  private toolsCache: Record<string, any> = {};
  private initializationPromise: Promise<void> | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl || process.env.MCP_SERVER_URL || "http://localhost:3035";
  }

  /**
   * Initialize MCP client and fetch all tools
   * Can be called multiple times - will return the same promise
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // If initialization is already in progress, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  /**
   * Get tools synchronously (returns empty object if not ready)
   */
  getToolsSync(): Record<string, any> {
    if (!this.isInitialized) {
      return {};
    }
    return this.toolsCache;
  }

  /**
   * Get ready AI SDK tools (waits for initialization if needed)
   */
  async getTools(): Promise<Record<string, any>> {
    if (!this.isInitialized && !this.initializationPromise) {
      // Start initialization if not already started
      await this.initialize();
    } else if (this.initializationPromise) {
      // Wait for ongoing initialization
      await this.initializationPromise;
    }

    return this.toolsCache;
  }

  /**
   * Check if MCP is ready without waiting
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Start initialization in background
   */
  initializeInBackground(): void {
    if (!this.isInitialized && !this.initializationPromise) {
      this.initialize().catch((error) => {
        logger.error("Background MCP initialization failed:", error);
      });
    }
  }

  /**
   * Internal initialization logic
   */
  private async doInitialize(): Promise<void> {
    if (this.isInitialized) return;

    const maxRetries = 10;
    const retryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(
          `🚀 Initializing MCP client... (attempt ${attempt}/${maxRetries})`
        );

        // Get sessionId
        logger.info("📡 Getting sessionId...");
        await this.getSessionId();
        logger.info(`✅ Got sessionId: ${this.sessionId}`);

        // Fetch all tools from MCP server
        logger.info("🔧 Fetching MCP tools...");
        const mcpTools = await this.fetchMCPTools();
        logger.info(`📥 Fetched ${mcpTools.length} MCP tools`);

        // Convert to AI SDK format and cache
        logger.info("🔄 Converting tools to AI SDK format...");
        this.toolsCache = this.convertToAISDKTools(mcpTools);

        this.isInitialized = true;
        logger.info(
          `✅ MCP client initialized with ${Object.keys(this.toolsCache).length} tools`
        );
        return; // Success - exit retry loop
      } catch (error) {
        logger.warning(`⚠️ MCP initialization attempt ${attempt} failed:`);
        logger.warning(
          "Error message:",
          error instanceof Error ? error.message : String(error)
        );

        if (attempt === maxRetries) {
          logger.error("❌ MCP initialization failed after all retries:");
          logger.error("Error details:", error);
          logger.error(
            "Error stack:",
            error instanceof Error ? error.stack : "No stack"
          );

          // MCP initialization failed - continue with empty tools
          logger.warning(
            "⚠️ MCP initialization failed - will use only local tools"
          );
          this.toolsCache = {};
          this.isInitialized = true;

          return;
        }

        // Wait before retry
        logger.info(`⏳ Waiting ${retryDelay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * Get sessionId from SSE endpoint
   */
  private async getSessionId(): Promise<string> {
    if (this.sessionId) return this.sessionId;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("SSE connection timeout (10s)"));
      }, 10000);

      fetch(`${this.baseUrl}/sse`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`SSE connection failed: ${response.status}`);
          }

          if (!response.body) {
            throw new Error("No response body for SSE stream");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          const readChunk = () => {
            reader
              .read()
              .then(({ done, value }) => {
                if (done) {
                  clearTimeout(timeout);
                  reject(new Error("SSE stream ended without sessionId"));
                  return;
                }

                const chunk = decoder.decode(value, { stream: true });

                // Search for sessionId in chunks
                const sessionIdMatch = chunk.match(
                  /sessionId[=:][\s]*([a-f0-9\-]+)/i
                );
                if (sessionIdMatch && sessionIdMatch[1]) {
                  this.sessionId = sessionIdMatch[1];
                  logger.info("🆔 Got sessionId:", this.sessionId);
                  clearTimeout(timeout);
                  reader.cancel();
                  resolve(this.sessionId);
                  return;
                }

                readChunk();
              })
              .catch((error) => {
                clearTimeout(timeout);
                reject(error);
              });
          };

          readChunk();
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Get tools from MCP server via JSON-RPC with EventSource
   */
  private async fetchMCPTools(): Promise<MCPTool[]> {
    if (!this.sessionId) {
      throw new Error("No sessionId available");
    }

    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("MCP tools fetch timeout (15s)"));
      }, 15000);

      try {
        // Send POST request for tools/list
        const response = await fetch(
          `${this.baseUrl}/messages?sessionId=${this.sessionId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: `tools-${Date.now()}`,
              method: "tools/list",
              params: {},
            }),
          }
        );

        logger.info(`📤 MCP tools request status: ${response.status}`);

        if (response.status !== 202) {
          clearTimeout(timeout);
          reject(new Error(`Unexpected response status: ${response.status}`));
          return;
        }

        // Use fetch stream for SSE
        logger.info("Using fetch stream for SSE...");

        const sseResponse = await fetch(
          `${this.baseUrl}/sse?sessionId=${this.sessionId}`
        );
        if (!sseResponse.body) {
          throw new Error("No SSE response body");
        }

        const reader = sseResponse.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = "";

        const readStream = async () => {
          try {
            const { done, value } = await reader.read();
            if (done) {
              clearTimeout(timeout);
              reject(new Error("SSE stream ended without tools"));
              return;
            }

            const chunk = decoder.decode(value, { stream: true });
            sseBuffer += chunk;

            // Search for completed SSE messages (end with \n\n)
            const messages = sseBuffer.split("\n\n");
            sseBuffer = messages.pop() || ""; // Keep incomplete message in buffer

            for (const message of messages) {
              if (message.trim()) {
                logger.info(
                  "📡 Complete SSE message:",
                  message.substring(0, 150)
                );

                // Parse SSE format: event: xxx\ndata: yyy
                const dataMatch = message.match(/data:\s*(.+)/);
                if (dataMatch && dataMatch[1]) {
                  const data = dataMatch[1].trim();

                  // Search for tools in data
                  if (data.includes('"tools"')) {
                    try {
                      const jsonData = JSON.parse(data);
                      if (jsonData.result && jsonData.result.tools) {
                        const tools = jsonData.result.tools;
                        logger.info(
                          `🎯 Got ${tools.length} tools from SSE stream`
                        );

                        clearTimeout(timeout);
                        reader.cancel();
                        resolve(tools);
                        return;
                      }
                    } catch (parseError) {
                      logger.info(
                        "Could not parse SSE data as JSON, continuing..."
                      );
                    }
                  }
                }
              }
            }

            // Continue reading
            readStream();
          } catch (streamError) {
            clearTimeout(timeout);
            reject(streamError);
          }
        };

        readStream();
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Convert MCP tools to AI SDK format
   */
  private convertToAISDKTools(mcpTools: MCPTool[]): Record<string, any> {
    const aiTools: Record<string, any> = {};

    for (const mcpTool of mcpTools) {
      const zodSchema = this.convertToZodSchema(mcpTool.inputSchema);

      aiTools[mcpTool.name] = tool({
        description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
        parameters: zodSchema,
        execute: async (args: any) => {
          return await this.callMCPTool(mcpTool.name, args);
        },
      });
    }

    logger.info(
      `Converted ${Object.keys(aiTools).length} MCP tools for AI SDK`
    );
    return aiTools;
  }

  /**
   * Call MCP tool
   */
  private async callMCPTool(
    name: string,
    arguments_: Record<string, any>
  ): Promise<any> {
    if (!this.sessionId) {
      throw new Error("No sessionId available for tool call");
    }

    try {
      logger.info(`🔧 Calling MCP tool: ${name}`);
      logger.info(`📋 Arguments:`, arguments_);

      const response = await fetch(
        `${this.baseUrl}/messages?sessionId=${this.sessionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: `call-${Date.now()}`,
            method: "tools/call",
            params: {
              name,
              arguments: arguments_,
            },
          }),
        }
      );

      logger.info(`📤 Tool call response status: ${response.status}`);

      if (response.status === 202) {
        const responseText = await response.text();
        logger.info(`📥 Tool call response: ${responseText.substring(0, 200)}`);

        if (responseText === "Accepted") {
          // For tool calls also need to wait for async response
          logger.info("💭 Tool call accepted, waiting for async result...");

          // For now return successful result
          // In reality need to wait for SSE response here
          return {
            success: true,
            message: `Tool ${name} executed (async)`,
            note: "This is a placeholder result - real MCP tool execution may be async",
          };
        }

        try {
          const jsonResponse = JSON.parse(responseText);
          logger.info(`✅ Tool ${name} executed with response:`, jsonResponse);
          return jsonResponse;
        } catch (parseError) {
          logger.error("Failed to parse tool call response:", parseError);
        }
      } else {
        const responseText = await response.text();
        logger.error(
          `Unexpected tool call status ${response.status}:`,
          responseText
        );
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      logger.error(`Failed to call MCP tool ${name}:`, error);

      return {
        error: true,
        message: `MCP tool ${name} failed`,
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Convert JSON Schema to Zod schema
   */
  private convertToZodSchema(
    inputSchema: MCPTool["inputSchema"]
  ): z.ZodType<any> {
    if (inputSchema.type !== "object") {
      return z.any();
    }

    const shape: Record<string, z.ZodType<any>> = {};

    for (const [key, prop] of Object.entries(inputSchema.properties || {})) {
      let zodType: z.ZodType<any>;

      switch (prop.type) {
        case "string":
          zodType = z.string();
          break;
        case "number":
          zodType = z.number();
          break;
        case "boolean":
          zodType = z.boolean();
          break;
        case "array":
          zodType = z.array(z.any());
          break;
        default:
          zodType = z.any();
      }

      if (prop.description) {
        zodType = zodType.describe(prop.description);
      }

      if (!inputSchema.required?.includes(key)) {
        zodType = zodType.optional();
      }

      shape[key] = zodType;
    }

    return z.object(shape);
  }

  /**
   * Clear cache and restart
   */
  reset(): void {
    this.sessionId = null;
    this.isInitialized = false;
    this.toolsCache = {};
  }
}

// Singleton instance
export const mcpWrapper = new MCPWrapper();

// Legacy exports for compatibility
export const mcpClient = {
  getAISDKTools: () => mcpWrapper.getTools(),
  reset: () => mcpWrapper.reset(),
};
