import { eq, sql } from "drizzle-orm";
import { db } from "../api/db.ts";
import { chats, messages, stacks } from "../db/schema";
import { myLogger as logger } from "../utils/logger";

export const DEFAULT_STACK_ID = "1";

/** Create a new chat. */
export async function createChat(titleSuggestion: string) {
  try {
    const [row] = await db
      .insert(chats)
      .values({ title: titleSuggestion })
      .returning({ id: chats.id });
    return row.id;
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

/** Get chat history and persist access if needed. */
export async function getHistoryAndPersist({
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
        timestamp:
          msg.createdAt instanceof Date
            ? msg.createdAt.getTime()
            : msg.createdAt,
        context: msg.context ?? undefined,
      })),
      hasMore: history.hasMore,
    };
  } catch (err) {
    logger.error(JSON.stringify(err), "getHistoryAndPersist failed");
    throw err;
  }
}
