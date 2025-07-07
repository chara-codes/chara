import { eq, sql } from "drizzle-orm";
import { db } from "../api/db.ts";
import { chats, messages, projects, stacks } from "../db/schema";
import { myLogger as logger } from "../utils/logger";

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

/** Check if a chat exists for the given project. */
export async function findExistingChat(
  projectId: number,
): Promise<number | null> {
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

async function getChatMessages(
  chatId: number,
  options?: { lastMessageId: number | null; limit?: number },
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
