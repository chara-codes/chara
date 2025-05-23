import { streamText } from "ai";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../api/db.ts";
import { chats, messages } from "../db/schema";
import { myLogger as logger } from "../utils/logger";
import { myAgent } from "../ai/agents/my-agent.ts";

export const DEFAULT_PROJECT_ID = 1;

/** Check if a chat exists for the given project. */
export async function findExistingChat(projectId: number): Promise<number | null> {
  try {
    const [existing] = await db
      .select({ id: chats.id })
      .from(chats)
      .where(eq(chats.projectId, projectId))
      .orderBy(sql`${chats.createdAt} desc`)
      .limit(1);
    return existing?.id ?? null;
  } catch (err) {
    logger.error(JSON.stringify(err), "findExistingChat failed");
    throw err;
  }
}

/** Create a new chat for the given project. */
export async function createChat(projectId: number, titleSuggestion: string) {
  try {
    const [row] = await db
      .insert(chats)
      .values({ projectId, title: titleSuggestion })
      .returning({ id: chats.id });
    return row.id;
  } catch (err) {
    logger.error(JSON.stringify(err), "createChat failed");
    throw err;
  }
}

/** Create (or reuse) a chat inside the given project. */
export async function ensureChat(projectId: number, titleSuggestion: string) {
  const existingId = await findExistingChat(projectId);
  
  if (existingId) {
    return existingId
  };

  return await createChat(projectId, titleSuggestion);
}

/** Persist the user message straight away. */
async function saveUserMessage(chatId: number, content: string) {
  try {
    await db.insert(messages).values({ chatId, role: "user", content });
  } catch (err) {
    logger.error(JSON.stringify(err), "saveUserMessage failed");
    throw err;
  }
}

/** Persist the assistant message (buffered). */
async function saveAssistantMessage(chatId: number, content: string) {
  try {
    await db.transaction(async (tx) => {
      await tx.insert(messages).values({ chatId, role: "assistant", content });
      await tx
        .update(chats)
        .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(chats.id, chatId));
    });
  } catch (err) {
    logger.error(JSON.stringify(err), "saveAssistantMessage failed");
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


      if (lastMsg?.createdAt) {
        whereCondition = sql`${messages.chatId} = ${chatId} AND ${messages.createdAt} < ${lastMsg.createdAt}`;
      }
    }

    const query = db
      .select()
      .from(messages)
      .where(whereCondition)
      .orderBy(sql`${messages.createdAt} desc`)
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

/** Stream plain‑text answer and persist history. */
export async function* streamTextAndPersist({
  chatId,
  question,
  ctx,
}: {
  chatId: number;
  question: string;
  ctx: any;
}) {
  await saveUserMessage(chatId, question);

  const { textStream } = streamText({
    model: ctx.ai(process.env.AI_MODEL || "gpt-4o-mini"),
    messages: [{ role: "user", content: question }],
  });

  let assistantBuf = "";
  try {
    for await (const chunk of textStream) {
      assistantBuf += chunk;
      yield chunk;
    }
  } catch (err) {
    logger.error(JSON.stringify(err), "streamText failed");
    throw err;
  }

  await saveAssistantMessage(chatId, assistantBuf);
}

/** Stream JSON‑shaped answer and persist history. */
export async function* streamObjectAndPersist({
  chatId,
  question,
  project,
  ctx,
  schema,
}: {
  chatId: number;
  question: string;
  project: { id: number; name: string };
  ctx: any;
  schema: ReturnType<typeof z.object>;
}) {
  await saveUserMessage(chatId, question);

  const agentStream = await myAgent(question, project);
  let assistantObj: Record<string, unknown> = {};
  try {
    for await (const partialObject of agentStream) {
      assistantObj = { ...assistantObj, ...partialObject };
      yield partialObject;
    }
  } catch (err) {
    logger.error(JSON.stringify(err), "streamObject failed");
    throw err;
  }

  await saveAssistantMessage(chatId, JSON.stringify(assistantObj));
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
      messages: history.messages.map((msg: any) => ({
      id: msg.id,
      message: msg.content,
      role: msg.role,
      timestamp: msg.createdAt instanceof Date ? msg.createdAt.getTime() : msg.createdAt,
      context: msg.context ?? undefined,
      })),
      hasMore: history.hasMore,
    };
  } catch (err) {
    logger.error(JSON.stringify(err), "getHistoryAndPersist failed");
    throw err;
  }
}
