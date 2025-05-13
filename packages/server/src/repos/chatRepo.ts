import { streamText } from "ai";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../api/db.ts";
import { chats, messages } from "../db/schema";
import { myLogger as logger } from "../utils/logger";
import { myAgent } from "../ai/agents/my-agent.ts";

export const DEFAULT_PROJECT_ID = 1;

/** Create (or reuse) a chat inside the given project. */
export async function ensureChat(projectId: number, titleSuggestion: string) {
  try {
    const [existing] = await db
      .select({ id: chats.id })
      .from(chats)
      .where(eq(chats.projectId, projectId))
      .orderBy(sql`${chats.createdAt} desc`)
      .limit(1);
    if (existing) return existing.id;

    const [row] = await db
      .insert(chats)
      .values({ projectId, title: titleSuggestion })
      .returning({ id: chats.id });
    return row.id;
  } catch (err) {
    logger.error(JSON.stringify(err), "ensureChat failed");
    throw err;
  }
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
      // TODO: uncomment when add updatedAt column to chats table
      // await tx
      //   .update(chats)
      //   .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
      //   .where(eq(chats.id, chatId));
    });
  } catch (err) {
    logger.error(JSON.stringify(err), "saveAssistantMessage failed");
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
