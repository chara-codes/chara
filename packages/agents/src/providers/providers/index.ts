// Export base provider interface and class
export { type BaseProvider, AbstractProvider } from "./base-provider";

// Export all provider implementations
export { OpenAIProvider, openaiProvider } from "./openai";
export { AnthropicProvider, anthropicProvider } from "./anthropic";
export { GoogleProvider, googleProvider } from "./google";
export { DeepSeekProvider, deepseekProvider } from "./deepseek";
export { OpenRouterProvider, openrouterProvider } from "./openrouter";
export { OllamaProvider, ollamaProvider } from "./ollama";
export { LMStudioProvider, lmstudioProvider } from "./lmstudio";
export { DIALProvider, dialProvider } from "./dial";
export { MoonshotProvider, moonshotProvider } from "./moonshot";

// Import provider instances for registry
import { openaiProvider } from "./openai";
import { anthropicProvider } from "./anthropic";
import { googleProvider } from "./google";
import { deepseekProvider } from "./deepseek";
import { openrouterProvider } from "./openrouter";
import { ollamaProvider } from "./ollama";
import { lmstudioProvider } from "./lmstudio";
import { dialProvider } from "./dial";
import { moonshotProvider } from "./moonshot";

// Export all provider instances as a registry
export const allProviders = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  google: googleProvider,
  deepseek: deepseekProvider,
  openrouter: openrouterProvider,
  ollama: ollamaProvider,
  lmstudio: lmstudioProvider,
  dial: dialProvider,
  moonshot: moonshotProvider,
};

// Export provider keys for easy iteration
export const providerKeys = Object.keys(
  allProviders
) as (keyof typeof allProviders)[];
