import { generateObject } from "ai";
import { aiProvider } from "../ai";
import { z } from "zod";
import { systemPrompt } from "./propmts/my-agent-propmt";
import { ee } from "../../utils/event-emitter";
import path from "node:path";

export const messageSchema = z.object({
  projectRoot: z.string().nonempty("Project root path should not be empty"),
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
});

export type AgentResponse = z.infer<typeof messageSchema>;

export const myAgent = async (
  task: string,
  project: { id: string; name: string },
): Promise<AgentResponse> => {
  try {
    const { object } = await generateObject({
      model: aiProvider(process.env.AI_MODEL || "gpt-4o-mini"),
      schema: messageSchema,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: task,
        },
      ],
    });

    console.log(
      "DEBUG: Generated complete object from AI:",
      JSON.stringify(object, null, 2),
    );

    // Emit the 'instructions:execute' event with the complete object
    ee.emit("instructions:execute", object);
    console.log(
      "DEBUG: Emitted instructions:execute event with complete object",
    );

    const projectDir = path.resolve(__dirname, "../../../../../");
    object.projectRoot = path.join(projectDir, "projects", project.name);

    return object;
  } catch (error) {
    console.error("Error in myAgent:", error);
    throw error;
  }
};
