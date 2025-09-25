import { generateId, type UIMessage } from "ai";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../api/db.ts";
import { chats, messages } from "../db/schema";
import { logger } from "../utils/logger";

interface MessageInsertData {
  id: string;
  chatId: string;
  parts: string;
  role: "user" | "assistant" | "system";
  metadata: string | null;
  createdAt: number | ReturnType<typeof sql>;
  commit: string | null;
  updatedAt: ReturnType<typeof sql>;
}

/** Create a new chat with UIMessage format. */
export async function createChat(
  titleSuggestion: string
): Promise<{ id: string; title: string; createdAt: number }> {
  try {
    const chatId = generateId();
    const [row] = await db
      .insert(chats)
      .values({
        id: chatId,
        title: titleSuggestion,
      })
      .returning({
        id: chats.id,
        createdAt: chats.createdAt,
        title: chats.title,
      });
    return row;
  } catch (err) {
    logger.error(JSON.stringify(err), "createChat failed");
    throw err;
  }
}

/**
 * Save UIMessages to database using an intelligent upsert strategy.
 *
 * This method preserves important database information while updating message content:
 * - **Preserves existing createdAt timestamps** for messages that already exist
 * - **Preserves existing commit information** (commit sha) from previous saves
 * - **Merges metadata** - combines existing metadata with new metadata, with new values taking precedence
 * - **Updates updatedAt timestamp** for all modified messages
 * - **Removes messages** that are no longer present in the input array
 * - **Inserts new messages** with proper timestamps and initial metadata
 *
 * @param chatId - The ID of the chat to save messages for
 * @param uiMessages - Array of UIMessage objects with optional createdAt timestamps
 *
 * @throws {Error} If database operations fail
 *
 * @example
 * ```typescript
 * const messages = [
 *   { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
 *   { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Hi there!' }] }
 * ];
 * await saveUIMessages('chat-123', messages);
 * ```
 *
 * @remarks
 * - For existing messages: createdAt, commit info preserved; parts, role, metadata updated
 * - For new messages: createdAt set from input or current timestamp
 * - Metadata is merged object-wise, not replaced entirely
 * - Messages removed from input array are deleted from database
 */
export async function saveUIMessages(
  chatId: string,
  uiMessages: (UIMessage & { createdAt?: Date | string })[]
): Promise<void> {
  try {
    if (uiMessages.length === 0) {
      return;
    }

    // Get existing messages for this chat
    const existingMessages = await db
      .select({
        id: messages.id,
        createdAt: messages.createdAt,
        commit: messages.commit,
        metadata: messages.metadata,
      })
      .from(messages)
      .where(eq(messages.chatId, chatId));

    const existingMessageMap = new Map(
      existingMessages.map((msg) => [msg.id, msg])
    );

    const messagesToInsert: MessageInsertData[] = [];
    const messagesToUpdate: MessageInsertData[] = [];

    for (const msg of uiMessages) {
      const existing = existingMessageMap.get(msg.id);

      let createdAtValue: number | ReturnType<typeof sql>;
      if (existing) {
        // Preserve existing createdAt for updates
        createdAtValue = existing.createdAt;
      } else if (msg.createdAt) {
        // Handle both Date objects and date strings for new messages
        if (msg.createdAt instanceof Date) {
          createdAtValue = Math.floor(msg.createdAt.getTime() / 1000);
        } else if (typeof msg.createdAt === "string") {
          const date = new Date(msg.createdAt);
          if (!Number.isNaN(date.getTime())) {
            createdAtValue = Math.floor(date.getTime() / 1000);
          } else {
            logger.warn(
              `Invalid date string for message ${msg.id}: ${msg.createdAt}`
            );
            createdAtValue = sql`CURRENT_TIMESTAMP` as ReturnType<typeof sql>;
          }
        } else {
          logger.warn(
            `Unexpected createdAt type for message ${msg.id}:`,
            typeof msg.createdAt
          );
          createdAtValue = sql`CURRENT_TIMESTAMP` as ReturnType<typeof sql>;
        }
      } else {
        createdAtValue = sql`CURRENT_TIMESTAMP` as ReturnType<typeof sql>;
      }

      // Merge metadata, preserving existing fields and adding new ones
      let mergedMetadata = null;
      if (existing?.metadata || msg.metadata) {
        const existingMeta = existing?.metadata
          ? typeof existing.metadata === "string"
            ? JSON.parse(existing.metadata)
            : existing.metadata
          : {};
        const newMeta = msg.metadata || {};
        mergedMetadata = JSON.stringify({ ...existingMeta, ...newMeta });
      }

      const messageData: MessageInsertData = {
        id: msg.id,
        chatId,
        parts: JSON.stringify(msg.parts),
        role: msg.role as "user" | "assistant" | "system",
        metadata: mergedMetadata,
        createdAt: createdAtValue,
        // Preserve existing commit for updates, allow new commit for new messages
        commit: existing?.commit || null,
        updatedAt: sql`CURRENT_TIMESTAMP` as ReturnType<typeof sql>,
      };

      if (existing) {
        messagesToUpdate.push(messageData);
      } else {
        messagesToInsert.push(messageData);
      }
    }

    // Insert new messages
    if (messagesToInsert.length > 0) {
      await db.insert(messages).values(messagesToInsert);
    }

    // Update existing messages
    for (const msgData of messagesToUpdate) {
      await db
        .update(messages)
        .set({
          parts: msgData.parts,
          role: msgData.role as "user" | "assistant" | "system",
          metadata: msgData.metadata,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(messages.id, msgData.id));
    }

    // Remove messages that are no longer in the uiMessages array
    const currentMessageIds = uiMessages.map((msg) => msg.id);
    const messagesToDelete = existingMessages
      .filter((existing) => !currentMessageIds.includes(existing.id))
      .map((msg) => msg.id);

    if (messagesToDelete.length > 0) {
      await db.delete(messages).where(inArray(messages.id, messagesToDelete));
    }

    // Update chat's updatedAt timestamp
    await db
      .update(chats)
      .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(chats.id, chatId));
  } catch (err) {
    logger.error(JSON.stringify(err), "saveUIMessages failed");
    throw err;
  }
}

/**
 * Save UIMessages to database with commit information.
 *
 * This is a convenience method that calls saveUIMessages and then updates
 * the commit information for all the messages.
 *
 * @param chatId - The ID of the chat to save messages for
 * @param uiMessages - Array of UIMessage objects with optional createdAt timestamps
 * @param commit - Git commit SHA to associate with these messages
 */
export async function saveUIMessagesWithCommit(
  chatId: string,
  uiMessages: (UIMessage & { createdAt?: Date | string })[],
  commit: string
): Promise<void> {
  try {
    // First save the messages using the standard method
    await saveUIMessages(chatId, uiMessages);

    // Then update commit information for all messages
    const messageIds = uiMessages.map((msg) => msg.id);
    await updateMessagesCommit(messageIds, commit);
  } catch (err) {
    logger.error(JSON.stringify(err), "saveUIMessagesWithCommit failed");
    throw err;
  }
}

/**
 * Updates commit information for specific messages
 */
export async function updateMessageCommit(
  messageId: string,
  commit: string
): Promise<void> {
  try {
    await db
      .update(messages)
      .set({
        commit,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(messages.id, messageId));
  } catch (err) {
    logger.error(JSON.stringify(err), "updateMessageCommit failed");
    throw err;
  }
}

/**
 * Updates commit information for multiple messages
 */
export async function updateMessagesCommit(
  messageIds: string[],
  commit: string
): Promise<void> {
  try {
    if (messageIds.length === 0) return;

    await db
      .update(messages)
      .set({
        commit,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(inArray(messages.id, messageIds));
  } catch (err) {
    logger.error(JSON.stringify(err), "updateMessagesCommit failed");
    throw err;
  }
}

/**
 * Updates metadata for a specific message while preserving existing metadata fields
 */
export async function updateMessageMetadata(
  messageId: string,
  newMetadata: Record<string, unknown>
): Promise<void> {
  try {
    // Get existing message to merge metadata
    const [existingMessage] = await db
      .select({ metadata: messages.metadata })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!existingMessage) {
      throw new Error(`Message with ID ${messageId} not found`);
    }

    // Merge metadata
    const existingMeta = existingMessage.metadata
      ? typeof existingMessage.metadata === "string"
        ? JSON.parse(existingMessage.metadata)
        : existingMessage.metadata
      : {};

    const mergedMetadata = JSON.stringify({ ...existingMeta, ...newMetadata });

    await db
      .update(messages)
      .set({
        metadata: mergedMetadata,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(messages.id, messageId));
  } catch (err) {
    logger.error(JSON.stringify(err), "updateMessageMetadata failed");
    throw err;
  }
}

/** Load UIMessages from database. */
export async function loadUIMessages(
  chatId: string
): Promise<(UIMessage & { createdAt?: Date })[]> {
  try {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);

    return result.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant" | "system",
      parts: JSON.parse(msg.parts as string),
      metadata: msg.metadata ? JSON.parse(msg.metadata as string) : undefined,
      createdAt: msg.createdAt ? new Date(msg.createdAt * 1000) : undefined,
    }));
  } catch (err) {
    logger.error(JSON.stringify(err), "loadUIMessages failed");
    throw err;
  }
}

/**
 * Load messages with full database metadata including commit information and timestamps.
 *
 * @param chatId - The ID of the chat to load messages for
 * @returns Array of messages with full metadata including commit, createdAt, updatedAt
 */
export async function loadUIMessagesWithMetadata(chatId: string): Promise<
  (UIMessage & {
    createdAt: Date;
    updatedAt: Date;
    commit: string | null;
    dbMetadata: Record<string, unknown> | null;
  })[]
> {
  try {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);

    return result.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant" | "system",
      parts: JSON.parse(msg.parts as string),
      metadata: msg.metadata ? JSON.parse(msg.metadata as string) : undefined,
      createdAt: new Date(msg.createdAt * 1000),
      updatedAt: new Date(msg.updatedAt * 1000),
      commit: msg.commit,
      dbMetadata: msg.metadata ? JSON.parse(msg.metadata as string) : null,
    }));
  } catch (err) {
    logger.error(JSON.stringify(err), "loadUIMessagesWithMetadata failed");
    throw err;
  }
}

/** Get a list of chats with optional pagination. */
export async function getChatList(options?: {
  limit?: number;
  offset?: number;
  parentId?: string | null;
}) {
  const { limit = 20, offset = 0, parentId } = options || {};

  try {
    let whereCondition = sql`1 = 1`;

    if (parentId !== undefined) {
      if (parentId === null) {
        whereCondition = sql`${chats.parentId} IS NULL`;
      } else {
        whereCondition = eq(chats.parentId, parentId);
      }
    }

    const result = await db
      .select({
        id: chats.id,
        title: chats.title,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
        parentId: chats.parentId,
        status: chats.status,
      })
      .from(chats)
      .where(whereCondition)
      .orderBy(sql`${chats.updatedAt} DESC`)
      .limit(limit + 1)
      .offset(offset);

    const hasMore = result.length > limit;
    const chatsResult = hasMore ? result.slice(0, limit) : result;

    return {
      chats: chatsResult,
      hasMore,
    };
  } catch (err) {
    logger.error(JSON.stringify(err), "getChatList failed");
    throw err;
  }
}

/** Get chat with its messages in UIMessage format. */
export async function getChatWithMessages(chatId: string) {
  try {
    // Get chat info
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (!chat) {
      throw new Error(`Chat with ID ${chatId} not found`);
    }

    // Get messages
    const uiMessages = await loadUIMessages(chatId);

    return {
      chat,
      messages: uiMessages,
    };
  } catch (err) {
    logger.error(JSON.stringify(err), "getChatWithMessages failed");
    throw err;
  }
}

/** Update a chat with new values. */
export async function updateChat({
  chatId,
  title,
  status,
}: {
  chatId: string;
  title?: string;
  status?: "idle" | "in_progress" | "completed" | "error";
}) {
  try {
    const updateValues: any = {};

    if (title !== undefined) updateValues.title = title;
    if (status !== undefined) updateValues.status = status;

    if (Object.keys(updateValues).length === 0) {
      throw new Error("No fields to update");
    }

    updateValues.updatedAt = sql`CURRENT_TIMESTAMP`;

    const [updatedChat] = await db
      .update(chats)
      .set(updateValues)
      .where(eq(chats.id, chatId))
      .returning({
        id: chats.id,
        title: chats.title,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
        parentId: chats.parentId,
        status: chats.status,
      });

    if (!updatedChat) {
      throw new Error(`Chat with ID ${chatId} not found`);
    }

    return updatedChat;
  } catch (err) {
    logger.error(JSON.stringify(err), "updateChat failed");
    throw err;
  }
}

/** Delete a chat and all its messages. */
export async function deleteChat(chatId: string) {
  try {
    // Delete messages first (cascade should handle this, but being explicit)
    await db.delete(messages).where(eq(messages.chatId, chatId));

    // Delete the chat
    const result = await db
      .delete(chats)
      .where(eq(chats.id, chatId))
      .returning({ id: chats.id });

    if (result.length === 0) {
      throw new Error(`Chat with ID ${chatId} not found`);
    }

    logger.info(`Deleted chat ${chatId} and all its messages`);
    return { deletedChatId: chatId };
  } catch (err) {
    logger.error(JSON.stringify(err), "deleteChat failed");
    throw err;
  }
}

/** Get the first message from the most recent chats. */
export async function getFirstMessageFromRecentChats(options?: {
  chatLimit?: number;
}) {
  const { chatLimit = 10 } = options || {};

  try {
    // Get the most recent chats
    const recentChats = await db
      .select({
        id: chats.id,
        title: chats.title,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
      })
      .from(chats)
      .orderBy(sql`${chats.updatedAt} DESC`)
      .limit(chatLimit);

    if (recentChats.length === 0) {
      return [];
    }

    const result = [];

    // Get the first message from each chat
    for (const chat of recentChats) {
      const [firstMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chat.id))
        .orderBy(messages.createdAt)
        .limit(1);

      let firstUIMessage: UIMessage | null = null;
      if (firstMessage) {
        firstUIMessage = {
          id: firstMessage.id,
          role: firstMessage.role as "user" | "assistant" | "system",
          parts: JSON.parse(firstMessage.parts as string).filter(
            (part: any) => part.type !== "step-start"
          ),
          metadata: firstMessage.metadata
            ? JSON.parse(firstMessage.metadata as string)
            : undefined,
          createdAt: new Date(
            typeof firstMessage.createdAt === "number"
              ? firstMessage.createdAt * 1000
              : firstMessage.createdAt
          ),
        } as any;
      }

      result.push({
        chat,
        firstMessage: firstUIMessage,
      });
    }

    return result;
  } catch (err) {
    logger.error(JSON.stringify(err), "getFirstMessageFromRecentChats failed");
    throw err;
  }
}

/** Add a single UIMessage to a chat. */
export async function addMessageToChat(
  chatId: string,
  message: UIMessage & { createdAt?: Date | string }
): Promise<void> {
  try {
    const msgAny = message as any;
    await db.insert(messages).values({
      id: message.id,
      chatId,
      parts: JSON.stringify(message.parts),
      role: message.role,
      metadata: message.metadata ? JSON.stringify(message.metadata) : null,
      createdAt: msgAny.createdAt
        ? Math.floor(
            (msgAny.createdAt instanceof Date
              ? msgAny.createdAt
              : new Date(msgAny.createdAt)
            ).getTime() / 1000
          )
        : sql`CURRENT_TIMESTAMP`,
    });

    // Update chat's updatedAt timestamp
    await db
      .update(chats)
      .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(chats.id, chatId));
  } catch (err) {
    logger.error(JSON.stringify(err), "addMessageToChat failed");
    throw err;
  }
}

/** Delete messages from a specific message onwards in a chat. */
export async function deleteMessagesFromChat(
  chatId: string,
  fromMessageId: string
) {
  try {
    // Get the message to determine its timestamp
    const [messageToDelete] = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.id, fromMessageId))
      .limit(1);

    if (!messageToDelete) {
      throw new Error(`Message with ID ${fromMessageId} not found`);
    }

    // Delete all messages from this timestamp onwards
    const result = await db
      .delete(messages)
      .where(
        sql`${messages.chatId} = ${chatId} AND ${messages.createdAt} >= ${messageToDelete.createdAt}`
      )
      .returning({ id: messages.id });

    logger.info(
      `Deleted ${result.length} messages from chat ${chatId} starting from message ${fromMessageId}`
    );

    return {
      deletedCount: result.length,
      deletedMessageIds: result.map((msg) => msg.id),
    };
  } catch (err) {
    logger.error(JSON.stringify(err), "deleteMessagesFromChat failed");
    throw err;
  }
}

/** Update a specific message by ID. */
export async function updateMessage(
  messageId: string,
  updates: {
    parts?: any[];
    role?: "user" | "assistant" | "system";
    metadata?: any;
    commit?: string;
  }
): Promise<UIMessage & { createdAt?: Date }> {
  try {
    // First check if the message exists
    const [existingMessage] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!existingMessage) {
      throw new Error(`Message with ID ${messageId} not found`);
    }

    const updateValues: any = {};

    if (updates.parts !== undefined) {
      updateValues.parts = JSON.stringify(updates.parts);
    }
    if (updates.role !== undefined) {
      updateValues.role = updates.role;
    }
    if (updates.metadata !== undefined) {
      updateValues.metadata = updates.metadata
        ? JSON.stringify(updates.metadata)
        : null;
    }
    if (updates.commit !== undefined) {
      updateValues.commit = updates.commit;
    }

    if (Object.keys(updateValues).length === 0) {
      throw new Error("No fields to update");
    }

    updateValues.updatedAt = sql`CURRENT_TIMESTAMP`;

    const [updatedMessage] = await db
      .update(messages)
      .set(updateValues)
      .where(eq(messages.id, messageId))
      .returning();

    if (!updatedMessage) {
      throw new Error(`Failed to update message with ID ${messageId}`);
    }

    // Update the chat's updatedAt timestamp
    await db
      .update(chats)
      .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(chats.id, updatedMessage.chatId));

    // Return the updated message in UIMessage format
    return {
      id: updatedMessage.id,
      role: updatedMessage.role as "user" | "assistant" | "system",
      parts: JSON.parse(updatedMessage.parts as string).filter(
        (part: any) => part.type !== "step-start"
      ),
      metadata: updatedMessage.metadata
        ? JSON.parse(updatedMessage.metadata as string)
        : undefined,
      createdAt: new Date(
        typeof updatedMessage.createdAt === "number"
          ? updatedMessage.createdAt * 1000
          : updatedMessage.createdAt
      ),
    };
  } catch (err) {
    logger.error(JSON.stringify(err), "updateMessage failed");
    throw err;
  }
}
