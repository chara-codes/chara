// Import provider instances for registry
import { anthropicProvider } from "./anthropic";
import { deepseekProvider } from "./deepseek";
import { dialProvider } from "./dial";
import { geminiCLIProvider } from "./gemini-cli";
import { googleProvider } from "./google";
import { lmstudioProvider } from "./lmstudio";
import { moonshotProvider } from "./moonshot";
import { ollamaProvider } from "./ollama";
import { openaiProvider } from "./openai";
import { openrouterProvider } from "./openrouter";

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
export { GeminiCLIProvider, geminiCLIProvider } from "./gemini-cli";

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
  "gemini-cli": geminiCLIProvider,
};

// Export provider keys for easy iteration
export const providerKeys = Object.keys(
  allProviders
) as (keyof typeof allProviders)[];
