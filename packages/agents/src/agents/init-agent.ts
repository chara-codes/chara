import { streamText, type CoreMessage } from "ai";
import { providersRegistry } from "../providers";
import { logger } from "@chara/logger";
import { tools } from "../tools";
import { initPrompt } from "../prompts/init.js";

interface ProjectInfo {
  dev?: string;
  info: {
    name?: string;
    description?: string;
    version?: string;
    frameworks?: string[];
    tools?: string[];
    stack?: string[];
    packageManager?: string;
    scripts?: Record<string, string>;
    dependencies?: string[];
    devDependencies?: string[];
    languages?: string[];
    projectType?: string;
  };
}

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
  const aiModel = providersRegistry.getModel(providerName, modelName);
  logger.info(providerName, modelName);

  const cwd = workingDir || process.cwd();
  logger.info(`Initializing project analysis in: ${cwd}`);

  // Create initial analysis message
  const messages: CoreMessage[] = [
    {
      role: "user",
      content: `Please analyze the current project directory and generate a .chara.json configuration file.

The file should have this structure:
\`\`\`json
{
  "dev": "command to start development server",
  "info": {
    "name": "project name",
    "description": "project description",
    "version": "project version",
    "frameworks": ["framework1", "framework2"],
    "tools": ["tool1", "tool2"],
    "stack": ["technology1", "technology2"],
    "packageManager": "npm|yarn|pnpm|bun",
    "scripts": {"script1": "command1"},
    "dependencies": ["dep1", "dep2"],
    "devDependencies": ["devDep1", "devDep2"],
    "languages": ["language1", "language2"],
    "projectType": "web|api|library|cli|mobile|desktop|other"
  }
}
\`\`\`

Start by analyzing the project directory structure, then examine key files like package.json, README, and other configuration files to understand the project.`,
    },
  ];

  return streamText({
    ...options,
    system: initPrompt({
      workingDir: cwd,
      hasTools: !!Object.keys(tools).length,
      hasTool: (name: string) => Object.keys(tools).includes(name),
    }),
    tools: {
      ...tools,
    },
    model: aiModel,
    toolCallStreaming: true,
    experimental_continueSteps: true,
    maxSteps: 50,
    messages,
  });
};
