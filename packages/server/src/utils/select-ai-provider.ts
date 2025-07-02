import { createAnthropic } from "@ai-sdk/anthropic";
import { createAzure } from "@ai-sdk/azure";
import { createCohere } from "@ai-sdk/cohere";
import { createDeepInfra } from "@ai-sdk/deepinfra";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOllama } from "ollama-ai-provider";
import { createDeepSeek } from "@ai-sdk/deepseek";

function getProviderName(apiUrl: string) {
  if (apiUrl.includes("api.openai.com")) return "openai";
  if (apiUrl.includes("azure.com")) return "azure";
  if (apiUrl.includes("api.anthropic.com")) return "anthropic";
  if (apiUrl.includes("api.cohere.ai")) return "cohere";
  if (apiUrl.includes("api.perplexity.ai")) return "perplexity";
  if (apiUrl.includes("api.mistral.ai")) return "mistral";
  if (apiUrl.includes("api.deepseek.com")) return "deepseek";
  if (apiUrl.includes("localhost:11434") || apiUrl.includes("ollama"))
    return "ollama";
  if (apiUrl.includes("api.deepinfra.com")) return "deepinfra";
  if (apiUrl.includes("ai-proxy.lab.epam.com")) return "dial";
  throw new Error(`Unsupported AI provider for URL: ${apiUrl}`);
}

export function selectAIProvider(config: { apiUrl: string; apiKey: string }) {
  const providerName = getProviderName(config.apiUrl);
  const params = {
    ...(config.apiUrl ? { baseURL: config.apiUrl } : {}),
    ...(config.apiKey ? { apiKey: config.apiKey } : {}),
  };
  switch (providerName) {
    case "openai":
      return createOpenAI(params);
    case "azure":
      return createAzure(params);
    case "anthropic":
      return createAnthropic(params);
    case "cohere":
      return createCohere(params);
    case "perplexity":
      return createOpenAICompatible({
        name: "perplexity",
        baseURL: config.apiUrl,
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      });
    case "mistral":
      return createMistral(params);
    case "ollama":
      return createOllama(params);
    case "deepinfra":
      return createDeepInfra(params);
    case "deepseek":
      return createDeepSeek(params);
    case "dial":
      // DIAL expects model in URL path but without Azure-specific parameters
      // Handle cases where URL might already contain deployment path
      let dialBaseURL = config.apiUrl;

      // Clean up any duplicate paths that might have been constructed
      dialBaseURL = dialBaseURL.replace(
        /\/openai\/deployments\/openai\/deployments/,
        "/openai/deployments",
      );
      dialBaseURL = dialBaseURL.replace(
        /\/chat\/completions\/chat\/completions$/,
        "/chat/completions",
      );

      return createOpenAICompatible({
        name: "dial",
        baseURL: dialBaseURL,
        headers: {
          "Api-Key": config.apiKey,
        },
      });
    default:
      throw new Error(`Unsupported AI provider: ${providerName}`);
  }
}
