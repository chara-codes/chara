import { db } from "../api/db";
import { stacks, links } from "../db/schema";
import { eq, like, sql } from "drizzle-orm";
import { techsToLinks } from "../utils/techLinks";
import {
  createStackSchema,
  updateStackSchema,
  toStackDTO,
  type StackDTO,
} from "../dto/stack";

export class StackNotFoundError extends Error {
  constructor() {
    super("Stack not found");
  }
}

// Type of the transaction object passed into the callback of db.transaction()
type TransactionType = Parameters<Parameters<typeof db.transaction>[0]>[0];
// Accept either a normal DB connection or a transaction reference
type Conn = typeof db | TransactionType;

// ——— Queries ———
export async function listWithLinks(conn: Conn = db): Promise<StackDTO[]> {
  const rows = await conn.query.stacks.findMany({ with: { links: true } });
  return rows.map(toStackDTO);
}

export async function findById(
  id: number,
  conn: Conn = db,
): Promise<StackDTO | null> {
  const row = await conn.query.stacks.findFirst({
    where: eq(stacks.id, id),
    with: { links: true },
  });
  return row ? toStackDTO(row) : null;
}

// ——— Mutations ———
export async function create(
  input: typeof createStackSchema._type,
): Promise<StackDTO> {
  return db.transaction(async (tx) => {
    const [stack] = await tx
      .insert(stacks)
      .values({
        title: input.title,
        type: input.type,
        description: input.description,
      })
      .returning();

    if (input.technologies.length) {
      await tx
        .insert(links)
        .values(techsToLinks(input.technologies, stack.id))
        .run();
    }

    const full = await findById(stack.id, tx);
    if (!full) throw new Error("Failed to load created stack");
    return full;
  });
}

export async function update(
  input: typeof updateStackSchema._type,
): Promise<StackDTO> {
  return db.transaction(async (tx) => {
    const [stack] = await tx
      .update(stacks)
      .set({
        title: input.title,
        description: input.description,
        type: input.type,
        updatedAt: new Date(),
      })
      .where(eq(stacks.id, input.id))
      .returning();

    await tx.delete(links).where(eq(links.stackId, input.id));
    if (input.technologies.length) {
      await tx
        .insert(links)
        .values(techsToLinks(input.technologies, input.id))
        .run();
    }

    const full = await findById(stack.id, tx);
    if (!full) throw new Error("Failed to load updated stack");
    return full;
  });
}

export const remove = async (id: number) => {
  await db.delete(stacks).where(eq(stacks.id, id));
};

export async function duplicate(id: number): Promise<StackDTO> {
  return db.transaction(async (tx) => {
    // Fetch original stack
    const src = await findById(id, tx);
    if (!src) throw new StackNotFoundError();

    // Generate unique title
    const base = src.title.replace(/\s\(copy.*?\)$/, "");
    const { cnt } = (await tx
      .select({ cnt: sql<number>`count(*)` })
      .from(stacks)
      .where(like(stacks.title, `${base} (copy%`))
      .get()) ?? { cnt: 0 };

    const n = cnt + 1;
    const title = n === 1 ? `${base} (copy)` : `${base} (copy ${n})`;

    // Insert clone row
    const [clone] = await tx
      .insert(stacks)
      .values({ title, type: src.type, description: src.description })
      .returning();

    // Clone links
    if (src.technologies.length) {
      await tx
        .insert(links)
        .values(techsToLinks(src.technologies, clone.id))
        .run();
    }

    const full = await findById(clone.id, tx);
    if (!full) throw new Error("Failed to load cloned stack");
    return full;
  });
}
