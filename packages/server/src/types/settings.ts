import { z } from "zod";

// Model configuration interface
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  contextSize?: number;
  hasTools?: boolean;
  recommended?: boolean;
  approved?: boolean;
}

// Settings-specific provider configuration (extends the base provider concept)
export interface SettingsProviderConfig {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'dial' | 'openrouter' | 'deepseek' | 'moonshot' | 'gemini-cli' | 'ollama' | 'lmstudio' | 'custom';
  enabled: boolean;
  configuration: Record<string, any>;
  requiredFields: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Provider form configuration for dynamic field generation
export interface ProviderFormConfig {
  type: string;
  fields: {
    name: string;
    type: 'text' | 'password' | 'url' | 'number';
    required: boolean;
    placeholder?: string;
    envVar?: string; // Environment variable name for this field
    validation?: (value: string) => string | null;
  }[];
}

// Provider type definitions with required fields (based on actual provider implementations)
export const PROVIDER_CONFIGS: Record<string, ProviderFormConfig> = {
  openai: {
    type: 'openai',
    fields: [
      { name: 'apiKey', type: 'password', required: true, placeholder: 'sk-...', envVar: 'OPENAI_API_KEY' }
    ]
  },
  anthropic: {
    type: 'anthropic',
    fields: [
      { name: 'apiKey', type: 'password', required: true, placeholder: 'sk-ant-...', envVar: 'ANTHROPIC_API_KEY' }
    ]
  },
  google: {
    type: 'google',
    fields: [
      { name: 'apiKey', type: 'password', required: true, placeholder: 'AI...', envVar: 'GOOGLE_GENERATIVE_AI_API_KEY' }
    ]
  },
  dial: {
    type: 'dial',
    fields: [
      { name: 'apiKey', type: 'password', required: true, placeholder: 'Bearer token', envVar: 'DIAL_API_KEY' },
      { name: 'baseUrl', type: 'url', required: true, placeholder: 'https://dial.example.com', envVar: 'DIAL_API_BASE_URL' }
    ]
  },
  openrouter: {
    type: 'openrouter',
    fields: [
      { name: 'apiKey', type: 'password', required: true, placeholder: 'sk-or-...', envVar: 'OPEN_ROUTER_API_KEY' }
    ]
  },
  deepseek: {
    type: 'deepseek',
    fields: [
      { name: 'apiKey', type: 'password', required: true, placeholder: 'sk-...', envVar: 'DEEPSEEK_API_KEY' }
    ]
  },
  moonshot: {
    type: 'moonshot',
    fields: [
      { name: 'apiKey', type: 'password', required: true, placeholder: 'sk-...', envVar: 'MOONSHOT_API_KEY' }
    ]
  },
  'gemini-cli': {
    type: 'gemini-cli',
    fields: [
      { name: 'apiKey', type: 'password', required: false, placeholder: 'AI... (optional, OAuth fallback)', envVar: 'GEMINI_API_KEY' }
    ]
  },
  ollama: {
    type: 'ollama',
    fields: [
      { name: 'baseUrl', type: 'url', required: false, placeholder: 'http://localhost:11434 (default)', envVar: 'OLLAMA_API_BASE_URL' }
    ]
  },
  lmstudio: {
    type: 'lmstudio',
    fields: [
      { name: 'baseUrl', type: 'url', required: false, placeholder: 'http://localhost:1234/v1 (default)', envVar: 'LMSTUDIO_API_BASE_URL' }
    ]
  },
  custom: {
    type: 'custom',
    fields: [
      { name: 'baseUrl', type: 'url', required: true, placeholder: 'https://api.example.com' },
      { name: 'apiKey', type: 'password', required: true, placeholder: 'API Key' }
    ]
  }
};

// Zod validation schemas
export const SettingsProviderConfigSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['openai', 'anthropic', 'google', 'dial', 'openrouter', 'deepseek', 'moonshot', 'gemini-cli', 'ollama', 'lmstudio', 'custom']),
  enabled: z.boolean(),
  configuration: z.record(z.any()),
  requiredFields: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const CreateProviderSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  type: z.enum(['openai', 'anthropic', 'google', 'dial', 'openrouter', 'deepseek', 'moonshot', 'gemini-cli', 'ollama', 'lmstudio', 'custom']),
  enabled: z.boolean().default(true),
  configuration: z.record(z.any()).default({})
});

export type CreateProviderInput = z.infer<typeof CreateProviderSchema>;

export const UpdateProviderSchema = z.object({
  id: z.string(),
  updates: z.object({
    name: z.string().min(2).optional(),
    enabled: z.boolean().optional(),
    configuration: z.record(z.any()).optional()
  })
});

// Settings error types
export enum SettingsErrorType {
  VALIDATION_ERROR = 'validation_error',
  NETWORK_ERROR = 'network_error',
  PROVIDER_CONFIG_ERROR = 'provider_config_error',
  MODEL_ENABLE_ERROR = 'model_enable_error',
  SETTINGS_SAVE_ERROR = 'settings_save_error'
}

export interface SettingsError {
  type: SettingsErrorType;
  message: string;
  field?: string;
  details?: any;
}

// Extended global settings interface
export interface ExtendedGlobalSettings {
  env?: Record<string, string>;
  models?: {
    whitelist?: any[];
    customModels?: any[];
    enabled?: string[]; // New: List of enabled model IDs
  };
  providers?: {
    [providerId: string]: SettingsProviderConfig; // New: Provider configurations
  };
  [key: string]: any;
}