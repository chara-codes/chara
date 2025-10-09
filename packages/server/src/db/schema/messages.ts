import { sql } from "drizzle-orm";
import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { chats } from "./chats";

/**
 * Represents individual messages in a chat conversation using UIMessage format.
 * This schema is designed to work with AI SDK's UIMessage structure for better
 * ecosystem compatibility and modern chat applications.
 *
 * @remarks
 * - Each message belongs to a specific chat conversation
 * - Messages are ordered chronologically by creation timestamp
 * - The role field supports user, assistant, and system messages
 * - Parts array stores the actual message content in UIMessage format
 * - Metadata field supports additional message context and annotations
 */

export const messages = sqliteTable(
  "messages",
  {
    /** Unique identifier for the message - compatible with UIMessage.id */
    id: text().primaryKey(),

    /** The message parts as JSON - stores UIMessage.parts array */
    parts: text({ mode: "json" }).notNull(),

    /** Indicates message sender type: 'user', 'assistant', or 'system' */
    role: text().notNull().$type<"user" | "assistant" | "system">(),

    /** Optional metadata as JSON - stores UIMessage.metadata */
    metadata: text({ mode: "json" }),

    /** Commit sha for tracking code changes */
    commit: text(),

    /** Timestamp when this message was created */
    createdAt: int("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    /** Timestamp when the message was last updated */
    updatedAt: int("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    /** Foreign key reference to the chat this message belongs to */
    chatId: text()
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
  },
  (table) => ({
    chatIdx: index("idx_messages_chat_id").on(table.chatId),
    createdAtIdx: index("idx_messages_created_at").on(table.createdAt),
    roleIdx: index("idx_messages_role").on(table.role),
  })
);
