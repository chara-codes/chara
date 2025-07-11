import { sql } from "drizzle-orm";
import {
  type AnySQLiteColumn,
  index,
  int,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

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
    createdAt: int("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    /** Timestamp when the chat was last updated */
    updatedAt: int("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    /** Optional reference to a parent chat, allowing for hierarchical chat organization */
    parentId: int().references((): AnySQLiteColumn => chats.id, {
      onDelete: "cascade",
    }),
  },
  (table) => ({
    parentIdx: index("idx_chats_parent_id").on(table.parentId),
  })
);
