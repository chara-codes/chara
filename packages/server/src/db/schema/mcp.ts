import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { stacks } from "./stacks";
import { relations } from "drizzle-orm";

/**
 * Represents Model Context Protocol (MCP) configurations used in the project.
 *
 * MCP defines the model checkpoint files and server configurations used for inference.
 * Each MCP entry is associated with a specific technology stack, and a stack can have
 * multiple MCP configurations.
 *
 * @remarks
 * - Stores information about AI model checkpoint files
 * - Includes server configuration for model inference
 * - Maintains many-to-one relationship with stacks (multiple MCPs can belong to one stack)
 */

export const mcp = sqliteTable("mcp", {
  /** Unique identifier for the MCP configuration */
  id: int().primaryKey({
    autoIncrement: true,
  }),
  /** Server name */
  name: text("name").notNull(),
  /** Server configuration as a JSON object */
  serverConfig: text({ mode: "json" }).notNull().$type<{
    /** Command to execute */
    command: string;
    /** Arguments to pass to the command */
    args?: string[];
    /** Environment variables to pass to the command */
    env?: Record<string, string>;
  }>(),

  /** Timestamp when this MCP configuration was created */
  createdAt: int("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  /** Foreign key reference to the stack this MCP belongs to */
  stackId: int()
    .notNull()
    .references(() => stacks.id, { onDelete: "cascade" }),
});
export const stackMcpRelations = relations(stacks, ({ many }) => ({
  mcps: many(mcp),
}));
export const mcpStackRelations = relations(mcp, ({ one }) => ({
  stack: one(stacks, {
    fields: [mcp.stackId],
    references: [stacks.id],
  }),
}));
