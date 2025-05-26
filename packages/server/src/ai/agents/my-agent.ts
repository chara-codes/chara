import { streamObject } from "ai";
import { aiProvider } from "../ai";
import { z } from "zod";
import { systemPrompt } from "./propmts/my-agent-propmt";
import { ee } from "../../utils/event-emitter";
import { resolveProjectPath } from "../../utils/file-utils";
import { getProjectContext } from "../../utils/get-project-context";

export const messageSchema = z.object({
  projectRoot: z.string().nonempty("Project root path should not be empty"),
  summary: z
    .string()
    .describe(
      "Explanation of the changes and actions needed to be execute to implement the task (in markdown for better formatting)",
    ),
  actions: z.array(
    z.object({
      type: z.enum(["shell", "create", "update", "rename", "delete"]),
      command: z.string().optional(),
      target: z.string().optional(),
      content: z.string().optional(),
      metadata: z
        .object({
          type: z.string().optional(),
          description: z.string().optional(),
        })
        .optional(),
    }),
  ),
  fileChanges: z
    .array(
      z.object({
        id: z.string().describe("File id, should include path and filename"),
        filename: z.string(),
        type: z.enum(["add", "delete", "modify"]).describe("Type of changes"),
        status: z
          .enum(["pending", "in-progress", "done", "skipped", "failed"])
          .default("pending"),
        description: z.string().describe("Short description of the chages "),
        content: z.string().describe("File content that should be saved"),
      }),
    )
    .describe("Summary of file changes and status for reporting")
    .optional(),
});

export type AgentResponse = z.infer<typeof messageSchema>;

// Replace the entire myAgent function with this streaming version
export const myAgent = async function* (
  task: string,
  project: { id: number; name: string },
): Promise<AgentResponse> {
  const projectRoot = resolveProjectPath(project.name);
  const projectContext = await getProjectContext(projectRoot);
  try {
    const { partialObjectStream } = streamObject({
      model: aiProvider(process.env.AI_MODEL || "gpt-4o-mini"),
      schema: messageSchema,
      messages: [
        {
          role: "system",
          content: systemPrompt + projectContext,
        },
        {
          role: "user",
          content: task,
        },
      ],
    });

    let lastObject: AgentResponse | null = null;

    // Stream the partial objects as they're generated
    for await (const partialObject of partialObjectStream) {
      lastObject = partialObject as AgentResponse;
      yield partialObject;
    }

    // After streaming is complete, emit the final complete object for execution
    if (lastObject) {
      console.log(
        "DEBUG: Streaming complete, emitting final object for execution",
      );

      lastObject.projectRoot = projectRoot;

      // Emit the 'instructions:execute' event with the complete object
      ee.emit("instructions:execute", lastObject);
      console.log(
        "DEBUG: Emitted instructions:execute event with complete object",
      );
    }

    return lastObject as AgentResponse;
  } catch (error) {
    console.error("Error in myAgent:", error);
    throw error;
  }
};
