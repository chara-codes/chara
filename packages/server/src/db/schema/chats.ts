import { projects } from "./projects";
import {
  int,
  sqliteTable,
  text,
  index,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Represents chat conversations in the system.
 * Chats can be organized hierarchically using parentId references.
 */
export const chats = sqliteTable(
  "chats",
  {
    /** Unique identifier for the chat. Auto-incremented. */
    id: int().primaryKey({
      autoIncrement: true,
    }),

    /** The title/name of the chat conversation */
    title: text().notNull(),

    /** Timestamp (in milliseconds) when the chat was created */
    createdAt: int({ mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    /** Timestamp when the chat was last updated */
    // updatedAt: int({ mode: "timestamp" })
    //   .notNull()
    //   .default(sql`CURRENT_TIMESTAMP`),

    /** Reference to the project this chat belongs to */
    projectId: int()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),

    /** Optional reference to a parent chat, allowing for hierarchical chat organization */
    parentId: int().references((): AnySQLiteColumn => chats.id, {
      onDelete: "cascade",
    }),
  },
  (table) => ({
    projectIdx: index("idx_chats_project_id").on(table.projectId),
    parentIdx: index("idx_chats_parent_id").on(table.parentId),
  }),
);
