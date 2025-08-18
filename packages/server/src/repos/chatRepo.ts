import { generateId, UIMessage } from "ai";
import { eq, sql } from "drizzle-orm";
import { db } from "../api/db.ts";
import { chats, messages } from "../db/schema";
import { logger } from "../utils/logger";

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

/** Save UIMessages to database. */
export async function saveUIMessages(
  chatId: string,
  uiMessages: UIMessage[]
): Promise<void> {
  try {
    // First, delete existing messages for this chat to avoid duplicates
    await db.delete(messages).where(eq(messages.chatId, chatId));

    // Insert all messages
    if (uiMessages.length > 0) {
      const messageValues = uiMessages.map((msg) => ({
        id: msg.id,
        chatId,
        parts: JSON.stringify(msg.parts),
        role: msg.role,
        metadata: msg.metadata ? JSON.stringify(msg.metadata) : null,
        createdAt: msg.createdAt
          ? Math.floor(msg.createdAt.getTime() / 1000)
          : sql`CURRENT_TIMESTAMP`,
      }));

      await db.insert(messages).values(messageValues);
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

/** Load UIMessages from database. */
export async function loadUIMessages(chatId: string): Promise<UIMessage[]> {
  try {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);

    return result.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      parts: JSON.parse(msg.parts as string),
      metadata: msg.metadata ? JSON.parse(msg.metadata as string) : undefined,
      createdAt: new Date(typeof msg.createdAt === 'number' ? msg.createdAt * 1000 : msg.createdAt),
    }));
  } catch (err) {
    logger.error(JSON.stringify(err), "loadUIMessages failed");
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
          parts: JSON.parse(firstMessage.parts as string),
          metadata: firstMessage.metadata
            ? JSON.parse(firstMessage.metadata as string)
            : undefined,
          createdAt: new Date(
            typeof firstMessage.createdAt === "number"
              ? firstMessage.createdAt * 1000
              : firstMessage.createdAt
          ),
        };
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
  message: UIMessage
): Promise<void> {
  try {
    await db.insert(messages).values({
      id: message.id,
      chatId,
      parts: JSON.stringify(message.parts),
      role: message.role,
      metadata: message.metadata ? JSON.stringify(message.metadata) : null,
      createdAt: message.createdAt
        ? Math.floor(message.createdAt.getTime() / 1000)
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
