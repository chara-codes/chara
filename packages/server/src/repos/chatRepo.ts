import { streamText } from "ai";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../api/db.ts";
import { chats, messages, projects, stacks } from "../db/schema";
import { myLogger as logger } from "../utils/logger";
import { myAgent } from "../ai/agents/my-agent.ts";

export const DEFAULT_PROJECT_ID = 1;
export const DEFAULT_PROJECT_NAME = "new project";
export const DEFAULT_STACK_ID = "1";

/** Ensure a project exists in the database, or create it if it doesn't. */
export async function ensureProjectExists({
  projectId,
  projectName,
  stackId,
}: {
  projectId: number;
  projectName: string;
  stackId: number;
}): Promise<void> {
  try {
    const [existing] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (existing) return;

    await db
      .insert(projects)
      .values({ id: projectId, name: projectName, stackId });
  } catch (err) {
    logger.error(JSON.stringify(err), "ensureProjectExists failed");
    throw err;
  }
}

/** Create (or reuse) a chat inside the given project. */
export async function ensureChat(
  projectId: number,
  titleSuggestion: string,
): Promise<number> {
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
    // Check if the project exists in the `projects` table
    const [existingProject] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!existingProject) {
      logger.info(`Project with ID ${projectId} does not exist. Creating it.`);
      try {
        const [newProject] = await db
          .insert(projects)
          .values({ id: projectId, name: `Project ${projectId}`, stackId: 1 })
          .returning({ id: projects.id });

        if (!newProject) {
          throw new Error(`Failed to create project with ID ${projectId}`);
        }
      } catch (err) {
        logger.error(JSON.stringify(err), "Failed to create project");
        throw err;
      }
    }

    // Check for an existing chat in the `chats` table
    const [existingChat] = await db
      .select({ id: chats.id })
      .from(chats)
      .where(eq(chats.projectId, projectId))
      .orderBy(sql`${chats.createdAt} desc`)
      .limit(1);

    if (existingChat) return existingChat.id;

    // Create a new chat if one doesn't exist
    const [newChat] = await db
      .insert(chats)
      .values({ projectId, title: titleSuggestion })
      .returning({ id: chats.id });

    return newChat.id;
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
