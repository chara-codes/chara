import { streamText } from "ai";
import { providersRegistry } from "../providers";
import { logger } from "@chara/logger";
import { initTools } from "../tools/init-tools";
import { initPrompt } from "../prompts/init";

export const initAgent = async (
  {
    model,
    workingDir,
  }: {
    model: string;
    workingDir?: string;
  },
  options: { headers?: Record<string, string> } = {},
) => {
  const [providerName = "openai", modelName = "gpt-4o-mini"] =
    model.split(":::");
  const aiModel = await providersRegistry.getModel(providerName, modelName);
  logger.info(providerName, modelName);

  const cwd = workingDir || process.cwd();

  return streamText({
    ...options,
    system: initPrompt({
      workingDir: cwd,
      hasTools: !!Object.keys(initTools).length,
      hasTool: (name: string) => Object.keys(initTools).includes(name),
    }),
    tools: {
      ...initTools,
    },
    model: aiModel,
    toolCallStreaming: true,
    experimental_continueSteps: true,
    maxSteps: 50,
    prompt: "Analyze the project and save configuration to .chara.json",
  });
};
