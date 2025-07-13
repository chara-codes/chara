import { eq, sql } from "drizzle-orm";
import { db } from "../api/db.ts";
import { chats, messages, stacks } from "../db/schema";
import { myLogger as logger } from "../utils/logger";

/** Create a new chat. */
export async function createChat(titleSuggestion: string) {
  try {
    const [row] = await db
      .insert(chats)
      .values({ title: titleSuggestion })
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

/** Create a new chat with the given title. */
export async function ensureChat(titleSuggestion: string): Promise<number> {
  try {
    const defaultStack = {
      id: 1, // Default stack ID
      title: "Default Stack",
      type: "others" as const,
      createdAt: sql`CURRENT_TIMESTAMP`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    // Ensure the default stack exists
    const [existingStack] = await db
      .select({ id: stacks.id })
      .from(stacks)
      .where(eq(stacks.id, defaultStack.id))
      .limit(1);

    if (!existingStack) {
      logger.info(`Default stack does not exist. Creating it.`);
      await db.insert(stacks).values(defaultStack).onConflictDoNothing();
    }

    // Create a new chat
    const [newChat] = await db
      .insert(chats)
      .values({ title: titleSuggestion })
      .returning({ id: chats.id });

    return newChat.id;
  } catch (err) {
    logger.error(JSON.stringify(err), "ensureChat failed");
    throw err;
  }
}

async function getChatMessages(
  chatId: number,
  options?: { lastMessageId: number | null; limit?: number }
) {
  const { lastMessageId, limit = 20 } = options || {};

  try {
    let whereCondition = eq(messages.chatId, chatId);

    if (lastMessageId) {
      const [lastMsg] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, lastMessageId))
        .limit(1);

      if (lastMsg.id) {
        whereCondition = sql`${messages.chatId} = ${chatId} AND ${messages.id} < ${lastMessageId}`;
      }
    }

    const query = db
      .select()
      .from(messages)
      .where(whereCondition)
      .orderBy(sql`${messages.id} desc`)
      .limit(limit + 1); // fetch one extra to check for more

    const result = await query;
    const hasMore = result.length > limit;

    const messagesResult = hasMore ? result.slice(0, limit) : result;

    return {
      messages: messagesResult.reverse(),
      hasMore,
    };
  } catch (err) {
    logger.error(JSON.stringify(err), "getChatMessages failed");
    throw err;
  }
}

/** Get a list of chats with optional pagination. */
export async function getChatList(options?: {
  limit?: number;
  offset?: number;
  parentId?: number | null;
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
      })
      .from(chats)
      .where(whereCondition)
      .orderBy(sql`${chats.updatedAt} DESC`)
      .limit(limit + 1)
      .offset(offset);

    const hasMore = result.length > limit;
    const chatsResult = hasMore ? result.slice(0, limit) : result;

    return {
      chats: chatsResult.map((chat) => ({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        parentId: chat.parentId,
      })),
      hasMore,
    };
  } catch (err) {
    logger.error(JSON.stringify(err), "getChatList failed");
    throw err;
  }
}

/** Get chat history and persist access if needed. */
export async function getHistory({
  chatId,
  lastMessageId,
  limit,
}: {
  chatId: number;
  lastMessageId: number | null;
  limit?: number;
}) {
  try {
    const history = await getChatMessages(chatId, {
      lastMessageId,
      limit,
    });

    return {
      messages: history.messages.map((msg) => ({
        id: msg.id,
        message: msg.content,
        role: msg.role,
        timestamp: msg.createdAt,
        context: msg.context ?? undefined,
        toolCalls: msg.toolCalls ?? undefined,
      })),
      hasMore: history.hasMore,
    };
  } catch (err) {
    logger.error(JSON.stringify(err), "getHistoryAndPersist failed");
    throw err;
  }
}

/** Save a new message to a chat. */
export async function saveMessage({
  chatId,
  content,
  role,
  context,
  toolCalls,
}: {
  chatId: number;
  content: string;
  role: string;
  context?: any;
  toolCalls?: any;
}) {
  try {
    const [message] = await db
      .insert(messages)
      .values({
        chatId,
        content,
        role,
        context: context ? JSON.stringify(context) : null,
        toolCalls: toolCalls ? JSON.stringify(toolCalls) : null,
      })
      .returning({
        id: messages.id,
        content: messages.content,
        role: messages.role,
        createdAt: messages.createdAt,
        context: messages.context,
        toolCalls: messages.toolCalls,
      });

    return {
      id: message.id,
      content: message.content,
      role: message.role,
      timestamp:
        message.createdAt instanceof Date
          ? message.createdAt.getTime()
          : message.createdAt,
      context: message.context
        ? JSON.parse(message.context as string)
        : undefined,
      toolCalls: message.toolCalls
        ? JSON.parse(message.toolCalls as string)
        : undefined,
    };
  } catch (err) {
    logger.error(JSON.stringify(err), "saveMessage failed");
    throw err;
  }
}
