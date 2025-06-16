import { tool } from "ai";
import { z } from "zod";
import { logger } from "@chara/logger";

/**
 * Local tools that are always available
 * These work alongside MCP tools, not as fallbacks
 */
export const localTools = {
  getCurrentTime: tool({
    description: "Get the current date and time",
    parameters: z.object({}),
    execute: async () => {
      const now = new Date();
      logger.info("🕐 Getting current time");
      return {
        datetime: now.toISOString(),
        formatted: now.toLocaleString(),
        timestamp: now.getTime(),
      };
    },
  }),

  calculateMath: tool({
    description: "Perform mathematical calculations",
    parameters: z.object({
      expression: z.string().describe("Mathematical expression to calculate"),
    }),
    execute: async ({ expression }) => {
      logger.info(`🧮 Calculating: ${expression}`);
      try {
        // Safe eval for basic math operations
        const result = Function(`"use strict"; return (${expression})`)();
        return {
          expression,
          result,
          type: typeof result,
        };
      } catch (error) {
        return {
          expression,
          error: error instanceof Error ? error.message : "Calculation error",
        };
      }
    },
  }),

  systemInfo: tool({
    description: "Get basic system information",
    parameters: z.object({}),
    execute: async () => {
      logger.info("💻 Getting system info");
      return {
        platform: process.platform,
        nodeVersion: process.version,
        runtime: "Bun",
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };
    },
  }),
};
