export interface ProviderConfig {
  name: string;
  envKey: string;
  description: string;
  requiresApiKey: boolean;
  defaultValue?: string;
  additionalEnvKeys?: string[];
  helpUrl: string;
}

export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  openai: {
    name: "OpenAI",
    envKey: "OPENAI_API_KEY",
    description: "OpenAI GPT models (GPT-4, GPT-3.5, etc.)",
    requiresApiKey: true,
    helpUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    name: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
    description: "Anthropic Claude models (Claude-3, Claude-2, etc.)",
    requiresApiKey: true,
    helpUrl: "https://console.anthropic.com/",
  },
  google: {
    name: "Google",
    envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    description: "Google Gemini models",
    requiresApiKey: true,
    helpUrl: "https://aistudio.google.com/app/apikey",
  },
  deepseek: {
    name: "DeepSeek",
    envKey: "DEEPSEEK_API_KEY",
    description: "DeepSeek AI models",
    requiresApiKey: true,
    helpUrl: "https://platform.deepseek.com/api_keys",
  },
  openrouter: {
    name: "OpenRouter",
    envKey: "OPEN_ROUTER_API_KEY",
    description: "OpenRouter (access to multiple models)",
    requiresApiKey: true,
    helpUrl: "https://openrouter.ai/keys",
  },
  ollama: {
    name: "Ollama",
    envKey: "OLLAMA_API_BASE_URL",
    description: "Local Ollama models",
    requiresApiKey: false,
    defaultValue: "http://127.0.0.1:11434/api",
    helpUrl: "https://ollama.com/download",
  },
  lmstudio: {
    name: "LMStudio",
    envKey: "LMSTUDIO_API_BASE_URL",
    description: "LMStudio local models",
    requiresApiKey: false,
    defaultValue: "http://localhost:1234/v1",
    helpUrl: "https://lmstudio.ai/",
  },
  dial: {
    name: "DIAL",
    envKey: "DIAL_API_KEY",
    description: "DIAL (Distributed AI Layer)",
    requiresApiKey: true,
    additionalEnvKeys: ["DIAL_API_BASE_URL"],
    helpUrl: "https://epam-rail.com/dial_api",
  },
  moonshot: {
    name: "Moonshot",
    envKey: "MOONSHOT_API_KEY",
    description: "Moonshot AI",
    requiresApiKey: true,
    helpUrl: "https://platform.moonshot.ai/console/api-keys",
  },
};
