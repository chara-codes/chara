import { type McpRow, mcpSchema } from "../dto/stack";
import type { z } from "zod";

export type McpInput = z.infer<typeof mcpSchema>;

/**
 * Convert UI-level "mcp" objects into McpRow objects for bulk insert.
 */
export function mcpsToDb(mcps: McpInput[], stackId: number) {
  return mcps.map(mcp => ({
    name: mcp.name,
    serverConfig: mcp.serverConfig,
    stackId,
  })) as Omit<McpRow, "id" | "createdAt">[];
}

/**
 * Convert McpRow objects back into McpInput objects for the API layer.
 */
export function mcpsToStack(rows: McpRow[]): McpInput[] {
  return rows.map(row => ({
    name: row.name,
    serverConfig: row.serverConfig,
  }));
}
