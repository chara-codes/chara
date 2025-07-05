import {
  readGlobalConfig,
  updateGlobalConfig,
  existsGlobalConfig,
} from "./global-config";

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  contextSize: number;
  hasTools: boolean;
  recommended: boolean;
  approved: boolean;
}

// Default models whitelist with extended information
export const DEFAULT_MODELS_WHITELIST: ModelConfig[] = [
  // Google Gemini models
  {
    id: "models/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    contextSize: 1000000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "models/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    contextSize: 2000000,
    hasTools: true,
    recommended: true,
    approved: true,
  },

  // DIAL models
  {
    id: "gpt-4.1-mini-2025-04-14",
    name: "GPT-4.1 Mini",
    provider: "dial",
    contextSize: 128000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "dial",
    contextSize: 2000000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "dial",
    contextSize: 1000000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "claude-sonnet-4@20250514",
    name: "Claude Sonnet 4",
    provider: "dial",
    contextSize: 200000,
    hasTools: true,
    recommended: true,
    approved: true,
  },
  {
    id: "claude-3-7-sonnet@20250219",
    name: "Claude 3.7 Sonnet",
    provider: "dial",
    contextSize: 200000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "gpt-4.1-2025-04-14",
    name: "GPT-4.1",
    provider: "dial",
    contextSize: 128000,
    hasTools: true,
    recommended: true,
    approved: true,
  },

  // Anthropic Claude models
  {
    id: "claude-opus-4-20250514",
    name: "Claude Opus 4",
    provider: "anthropic",
    contextSize: 200000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    contextSize: 200000,
    hasTools: true,
    recommended: true,
    approved: true,
  },
  {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude 3.7 Sonnet",
    provider: "anthropic",
    contextSize: 200000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    contextSize: 200000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    contextSize: 200000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  // OpenRouter
  {
    id: "anthropic/claude-opus-4",
    name: "Claude Opus 4",
    provider: "openrouter",
    contextSize: 200000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "openrouter",
    contextSize: 200000,
    hasTools: true,
    recommended: true,
    approved: true,
  },
  {
    id: "anthropic/claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet",
    provider: "openrouter",
    contextSize: 200000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "openrouter",
    contextSize: 200000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "anthropic/claude-3.7-sonnet:thinking",
    name: "Claude 3.7 Sonnet (Thinking)",
    provider: "openrouter",
    contextSize: 200000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "anthropic/claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "openrouter",
    contextSize: 200000,
    hasTools: true,
    recommended: false,
    approved: true,
  },

  // OpenAI GPT models
  {
    id: "openai/gpt-4.1",
    name: "GPT-4.1",
    provider: "openrouter",
    contextSize: 128000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openrouter",
    contextSize: 128000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "openai/gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    provider: "openrouter",
    contextSize: 128000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openrouter",
    contextSize: 128000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "openai",
    contextSize: 128000,
    hasTools: true,
    recommended: true,
    approved: true,
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    contextSize: 128000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    provider: "openai",
    contextSize: 128000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    contextSize: 128000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    contextSize: 128000,
    hasTools: true,
    recommended: false,
    approved: true,
  },

  // Mistral models
  {
    id: "mistralai/mistral-nemo:free",
    name: "Mistral Nemo (Free)",
    provider: "openrouter",
    contextSize: 128000,
    hasTools: false,
    recommended: false,
    approved: true,
  },
  {
    id: "mistralai/mistral-large",
    name: "Mistral Large",
    provider: "openrouter",
    contextSize: 128000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "mistralai/codestral-2501",
    name: "Codestral 2501",
    provider: "openrouter",
    contextSize: 128000,
    hasTools: true,
    recommended: false,
    approved: true,
  },

  // Google Gemini models via OpenRouter
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "openrouter",
    contextSize: 1000000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "openrouter",
    contextSize: 2000000,
    hasTools: true,
    recommended: true,
    approved: true,
  },

  // DeepSeek models
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    provider: "deepseek",
    contextSize: 128000,
    hasTools: true,
    recommended: true,
    approved: true,
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek Reasoner",
    provider: "deepseek",
    contextSize: 128000,
    hasTools: true,
    recommended: false,
    approved: true,
  },
];

interface GlobalConfigWithModels {
  models?: {
    whitelist?: ModelConfig[];
    customModels?: ModelConfig[];
  };
}

/**
 * Get the current models whitelist from global config
 * Returns default whitelist if no custom config exists
 */
export const getModelsWhitelist = async (
  configFile?: string,
): Promise<ModelConfig[]> => {
  try {
    if (!(await existsGlobalConfig(configFile))) {
      return DEFAULT_MODELS_WHITELIST;
    }

    const config = (await readGlobalConfig(
      configFile,
    )) as GlobalConfigWithModels;
    const customWhitelist = config.models?.whitelist;
    const customModels = config.models?.customModels || [];

    // If no custom whitelist, return default + custom models
    if (!customWhitelist) {
      return [...DEFAULT_MODELS_WHITELIST, ...customModels];
    }

    // Return custom whitelist + custom models
    return [...customWhitelist, ...customModels];
  } catch (error) {
    // If config doesn't exist or error reading, return default
    return DEFAULT_MODELS_WHITELIST;
  }
};

/**
 * Set the models whitelist in global config
 */
export const setModelsWhitelist = async (
  models: ModelConfig[],
  configFile?: string,
): Promise<void> => {
  await updateGlobalConfig(
    {
      models: {
        whitelist: models,
      },
    },
    configFile,
  );
};

/**
 * Add a custom model to the user's configuration
 */
export const addCustomModel = async (
  model: ModelConfig,
  configFile?: string,
): Promise<void> => {
  const config = (await existsGlobalConfig(configFile))
    ? ((await readGlobalConfig(configFile)) as GlobalConfigWithModels)
    : {};

  const customModels = config.models?.customModels || [];

  // Check if model already exists
  const existingIndex = customModels.findIndex((m) => m.id === model.id);

  if (existingIndex >= 0) {
    // Update existing model
    customModels[existingIndex] = model;
  } else {
    // Add new model
    customModels.push(model);
  }

  await updateGlobalConfig(
    {
      models: {
        ...config.models,
        customModels,
      },
    },
    configFile,
  );
};

/**
 * Remove a custom model from the user's configuration
 */
export const removeCustomModel = async (
  modelId: string,
  configFile?: string,
): Promise<void> => {
  const config = (await existsGlobalConfig(configFile))
    ? ((await readGlobalConfig(configFile)) as GlobalConfigWithModels)
    : {};

  const customModels = config.models?.customModels || [];
  const filteredModels = customModels.filter((m) => m.id !== modelId);

  await updateGlobalConfig(
    {
      models: {
        ...config.models,
        customModels: filteredModels,
      },
    },
    configFile,
  );
};

/**
 * Get only custom models added by the user
 */
export const getCustomModels = async (
  configFile?: string,
): Promise<ModelConfig[]> => {
  try {
    if (!(await existsGlobalConfig(configFile))) {
      return [];
    }

    const config = (await readGlobalConfig(
      configFile,
    )) as GlobalConfigWithModels;
    return config.models?.customModels || [];
  } catch (error) {
    return [];
  }
};

/**
 * Reset models whitelist to default
 */
export const resetModelsWhitelist = async (
  configFile?: string,
): Promise<void> => {
  await updateGlobalConfig(
    {
      models: {
        whitelist: DEFAULT_MODELS_WHITELIST,
        customModels: [], // Also clear custom models
      },
    },
    configFile,
  );
};

/**
 * Get recommended models from the whitelist
 */
export const getRecommendedModels = async (
  configFile?: string,
): Promise<ModelConfig[]> => {
  const whitelist = await getModelsWhitelist(configFile);
  return whitelist.filter((model) => model.recommended);
};

/**
 * Get approved models from the whitelist
 */
export const getApprovedModels = async (
  configFile?: string,
): Promise<ModelConfig[]> => {
  const whitelist = await getModelsWhitelist(configFile);
  return whitelist.filter((model) => model.approved);
};

/**
 * Get models by provider
 */
export const getModelsByProvider = async (
  provider: string,
  configFile?: string,
): Promise<ModelConfig[]> => {
  const whitelist = await getModelsWhitelist(configFile);
  return whitelist.filter((model) => model.provider === provider);
};

/**
 * Get models with tool support
 */
export const getModelsWithTools = async (
  configFile?: string,
): Promise<ModelConfig[]> => {
  const whitelist = await getModelsWhitelist(configFile);
  return whitelist.filter((model) => model.hasTools);
};

/**
 * Find a model by ID
 */
export const findModelById = async (
  modelId: string,
  configFile?: string,
): Promise<ModelConfig | undefined> => {
  const whitelist = await getModelsWhitelist(configFile);
  return whitelist.find((model) => model.id === modelId);
};

/**
 * Check if a model is in the whitelist
 */
export const isModelWhitelisted = async (
  modelId: string,
  configFile?: string,
): Promise<boolean> => {
  const model = await findModelById(modelId, configFile);
  return model !== undefined;
};
