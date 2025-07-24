import { logger } from "@chara-codes/logger";
import { streamText } from "ai";
import { initPrompt } from "../prompts/init";
import { providersRegistry } from "../providers";
import { initTools } from "../tools/init-tools";

let tools: Record<string, any> = { ...initTools };

export const initAgent = async (
  {
    model,
    workingDir,
  }: {
    model: string;
    workingDir?: string;
  },
  options: { headers?: Record<string, string> } = {}
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
      hasTools: !!Object.keys(tools).length,
      hasTool: (name: string) => Object.keys(tools).includes(name),
    }),
    tools,
    model: aiModel,
    toolCallStreaming: true,
    experimental_continueSteps: true,
    maxSteps: 50,
    prompt: "Analyze the project and save configuration to .chara.json",
  });
};

initAgent.setTools = (newTools: Record<string, any>) => {
  tools = { ...initTools, ...newTools };
};
