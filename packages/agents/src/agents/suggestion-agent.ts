import { logger } from "@chara-codes/logger";
import { generateText, type CoreMessage } from "ai";
import { suggestionPrompt } from "../prompts/suggestion";
import { providersRegistry } from "../providers";
import { chatToolsAskMode } from "../tools/chat-tools";

/**
 * Suggestion agent that analyzes the current environment and context to generate
 * relevant prompt suggestions for developers using streamText with tools.
 *
 * This agent uses tools to explore the project structure, understand the technology
 * stack, and identify opportunities for improvement or development tasks.
 *
 * The response format uses <---> separators to divide individual suggestions.
 */
export const suggestionAgent = async (
  {
    model,
    messages,
    workingDir = process.cwd(),
    maxSuggestions = 10,
    tools = {},
  }: {
    model: string;
    messages: CoreMessage[];
    workingDir?: string;
    maxSuggestions?: number;
    tools?: Record<string, unknown>;
  },
  options: { headers?: Record<string, string> } = {}
) => {
  const [providerName = "openai", modelName = "gpt-4o-mini"] =
    model.split(":::");
  const aiModel = await providersRegistry.getModel(providerName, modelName);

  // Combine built-in tools with external MCP tools
  const allTools = { ...chatToolsAskMode, ...tools };
  const totalTools = Object.keys(allTools).length;

  logger.debug(
    `🔍 Generating suggestions for working directory: ${workingDir}`
  );
  logger.debug(
    `🔧 Using ${totalTools} tools (${Object.keys(tools).length} external)`
  );

  return generateText({
    ...options,
    model: aiModel,
    system: suggestionPrompt({
      workingDir,
      hasTools: totalTools > 0,
      maxSuggestions,
    }),
    tools: allTools,
    temperature: 0.3,
    experimental_continueSteps: true,
    maxSteps: 10,
    messages,
    onError: (err) => {
      logger.dump(err);
    },
  });
};

/**
 * Helper function to parse suggestions from the streamed response
 * Splits the response by the <---> separator and cleans up each suggestion
 */
export const parseSuggestionsFromResponse = (response: string): string[] => {
  return response
    .split("<--->")
    .map((suggestion) => suggestion.trim())
    .filter((suggestion) => suggestion.length > 0)
    .map((suggestion) => {
      // Remove any markdown formatting or extra whitespace
      return suggestion
        .replace(/^#+\s*/, "") // Remove markdown headers
        .replace(/^\*{1,2}\s*/, "") // Remove bullet points with asterisks (single or double)
        .replace(/^-+\s*/, "") // Remove bullet points with dashes
        .replace(/^\d+\.\s*/, "") // Remove numbered lists
        .replace(/\*{2}$/, "") // Remove trailing bold markers
        .trim();
    });
};
