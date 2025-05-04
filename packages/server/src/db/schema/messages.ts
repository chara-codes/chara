import { int, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { chats } from "./chats";
import { sql } from "drizzle-orm";

/**
 * Represents individual messages in a chat conversation, storing both user queries
 * and LLM responses.
 *
 * @remarks
 * - Each message belongs to a specific chat conversation
 * - Messages are ordered chronologically by creation timestamp
 * - The role field distinguishes between user messages and LLM responses
 * - Messages maintain the complete conversation history for context
 */

export const messages = sqliteTable(
  "messages",
  {
    /** Unique identifier for the message */
    id: int().primaryKey({
      autoIncrement: true,
    }),
    /** The actual text content of the message */
    content: text().notNull(),

    /** Optional JSON object containing additional context for the message (can include list of files, commands, etc) */
    context: text({ mode: "json" }),

    /** Indicates message sender type: 'user' for user messages or 'assistant' for LLM responses */
    role: text().notNull(),

    /** Timestamp when this message was created */
    createdAt: int("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    /** Timestamp when the message was last updated */
    // updatedAt: int("updated_at",{ mode: "timestamp" })
    //   .notNull()
    //   .default(sql`CURRENT_TIMESTAMP`),

    /** Foreign key reference to the chat this message belongs to */
    chatId: int()
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
  },
  (table) => ({
    chatIdx: index("idx_messages_chat_id").on(table.chatId),
  }),
);
