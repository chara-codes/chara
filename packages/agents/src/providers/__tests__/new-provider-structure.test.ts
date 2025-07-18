import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import {
  allProviders,
  providerKeys,
  openaiProvider,
  anthropicProvider,
  googleProvider,
  deepseekProvider,
  openrouterProvider,
  ollamaProvider,
  lmstudioProvider,
  dialProvider,
  moonshotProvider,
  type BaseProvider,
  AbstractProvider,
} from "../providers";

// Mock the global config module to prevent file system errors
mock.module("@chara-codes/settings", () => ({
  getVarFromEnvOrGlobalConfig: mock((key: string) => {
    // Return actual environment variable or undefined
    return Promise.resolve(process.env[key]);
  }),
}));

describe("New Provider Structure", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore environment after each test
    process.env = originalEnv;
  });

  test("should export all required providers", () => {
    expect(allProviders).toBeDefined();
    expect(providerKeys).toBeDefined();
    expect(providerKeys.length).toBe(9);

    // Check that all expected providers are present
    expect(providerKeys).toContain("openai");
    expect(providerKeys).toContain("anthropic");
    expect(providerKeys).toContain("google");
    expect(providerKeys).toContain("deepseek");
    expect(providerKeys).toContain("openrouter");
    expect(providerKeys).toContain("ollama");
    expect(providerKeys).toContain("lmstudio");
    expect(providerKeys).toContain("dial");
    expect(providerKeys).toContain("moonshot");
  });

  test("should export individual provider instances", () => {
    expect(openaiProvider).toBeDefined();
    expect(anthropicProvider).toBeDefined();
    expect(googleProvider).toBeDefined();
    expect(deepseekProvider).toBeDefined();
    expect(openrouterProvider).toBeDefined();
    expect(ollamaProvider).toBeDefined();
    expect(lmstudioProvider).toBeDefined();
    expect(dialProvider).toBeDefined();
    expect(moonshotProvider).toBeDefined();
  });

  test("provider instances should have correct properties", () => {
    expect(openaiProvider.key).toBe("openai");
    expect(openaiProvider.name).toBe("OpenAI");
    expect(openaiProvider.requiresApiKey).toBe(true);
    expect(openaiProvider.apiKeyEnvVar).toBe("OPENAI_API_KEY");

    expect(anthropicProvider.key).toBe("anthropic");
    expect(anthropicProvider.name).toBe("Anthropic");
    expect(anthropicProvider.requiresApiKey).toBe(true);
    expect(anthropicProvider.apiKeyEnvVar).toBe("ANTHROPIC_API_KEY");

    expect(ollamaProvider.key).toBe("ollama");
    expect(ollamaProvider.name).toBe("Ollama");
    expect(ollamaProvider.requiresApiKey).toBe(false);
    expect(ollamaProvider.baseUrlEnvVar).toBe("OLLAMA_API_BASE_URL");
    expect(ollamaProvider.defaultBaseUrl).toBe("http://localhost:11434");

    expect(dialProvider.key).toBe("dial");
    expect(dialProvider.name).toBe("DIAL");
    expect(dialProvider.requiresApiKey).toBe(true);
    expect(dialProvider.apiKeyEnvVar).toBe("DIAL_API_KEY");
    expect(dialProvider.baseUrlEnvVar).toBe("DIAL_API_BASE_URL");

    expect(moonshotProvider.key).toBe("moonshot");
    expect(moonshotProvider.name).toBe("Moonshot");
    expect(moonshotProvider.requiresApiKey).toBe(true);
    expect(moonshotProvider.apiKeyEnvVar).toBe("MOONSHOT_API_KEY");
  });

  test("provider instances should implement BaseProvider interface", () => {
    const providers = [
      openaiProvider,
      anthropicProvider,
      googleProvider,
      deepseekProvider,
      openrouterProvider,
      ollamaProvider,
      lmstudioProvider,
      dialProvider,
      moonshotProvider,
    ];

    providers.forEach((provider) => {
      expect(typeof provider.canInitialize).toBe("function");
      expect(typeof provider.createProvider).toBe("function");
      expect(typeof provider.fetchModels).toBe("function");
      expect(typeof provider.healthCheck).toBe("function");
      expect(typeof provider.key).toBe("string");
      expect(typeof provider.name).toBe("string");
      expect(typeof provider.requiresApiKey).toBe("boolean");
    });
  });

  test("providers should be able to check initialization capability", async () => {
    // Set up environment variables
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-key";
    process.env.DEEPSEEK_API_KEY = "test-deepseek-key";
    process.env.OPEN_ROUTER_API_KEY = "test-openrouter-key";
    process.env.OLLAMA_API_BASE_URL = "http://localhost:11434";
    process.env.LMSTUDIO_API_BASE_URL = "http://localhost:1234/v1";
    process.env.DIAL_API_KEY = "test-dial-key";
    process.env.DIAL_API_BASE_URL = "http://localhost:8080";
    process.env.MOONSHOT_API_KEY = "test-moonshot-key";

    // Test providers that require API keys
    expect(await openaiProvider.canInitialize()).toBe(true);
    expect(await anthropicProvider.canInitialize()).toBe(true);
    expect(await googleProvider.canInitialize()).toBe(true);
    expect(await deepseekProvider.canInitialize()).toBe(true);
    expect(await openrouterProvider.canInitialize()).toBe(true);
    expect(await dialProvider.canInitialize()).toBe(true);
    expect(await moonshotProvider.canInitialize()).toBe(true);

    // Test providers that don't require API keys
    expect(await ollamaProvider.canInitialize()).toBe(true);
    expect(await lmstudioProvider.canInitialize()).toBe(true);
  });

  test("providers should fail initialization without required config", async () => {
    // Clear environment variables
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.OPEN_ROUTER_API_KEY;
    delete process.env.DIAL_API_KEY;
    delete process.env.DIAL_API_BASE_URL;
    delete process.env.MOONSHOT_API_KEY;

    // Test providers that require API keys
    expect(await openaiProvider.canInitialize()).toBe(false);
    expect(await anthropicProvider.canInitialize()).toBe(false);
    expect(await googleProvider.canInitialize()).toBe(false);
    expect(await deepseekProvider.canInitialize()).toBe(false);
    expect(await openrouterProvider.canInitialize()).toBe(false);
    expect(await dialProvider.canInitialize()).toBe(false);
    expect(await moonshotProvider.canInitialize()).toBe(false);

    // Test providers that don't require API keys but need URLs
    // These should still work with default URLs
    expect(await ollamaProvider.canInitialize()).toBe(true);
    expect(await lmstudioProvider.canInitialize()).toBe(true);
  });

  test("providers should be able to create provider factories", async () => {
    // Set up environment variables
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-key";
    process.env.DEEPSEEK_API_KEY = "test-deepseek-key";
    process.env.OPEN_ROUTER_API_KEY = "test-openrouter-key";
    process.env.OLLAMA_API_BASE_URL = "http://localhost:11434";
    process.env.LMSTUDIO_API_BASE_URL = "http://localhost:1234/v1";
    process.env.DIAL_API_KEY = "test-dial-key";
    process.env.DIAL_API_BASE_URL = "http://localhost:8080";
    process.env.MOONSHOT_API_KEY = "test-moonshot-key";

    // Test that providers can create factories
    const openaiFactory = await openaiProvider.createProvider();
    const anthropicFactory = await anthropicProvider.createProvider();
    const googleFactory = await googleProvider.createProvider();
    const deepseekFactory = await deepseekProvider.createProvider();
    const openrouterFactory = await openrouterProvider.createProvider();
    const ollamaFactory = await ollamaProvider.createProvider();
    const lmstudioFactory = await lmstudioProvider.createProvider();
    const dialFactory = await dialProvider.createProvider();
    const moonshotFactory = await moonshotProvider.createProvider();

    expect(typeof openaiFactory).toBe("function");
    expect(typeof anthropicFactory).toBe("function");
    expect(typeof googleFactory).toBe("function");
    expect(typeof deepseekFactory).toBe("function");
    expect(typeof openrouterFactory).toBe("function");
    expect(typeof ollamaFactory).toBe("function");
    expect(typeof lmstudioFactory).toBe("function");
    expect(typeof dialFactory).toBe("function");
    expect(typeof moonshotFactory).toBe("function");
  });

  test("providers should have fetchModels method", async () => {
    const providers = [
      openaiProvider,
      anthropicProvider,
      googleProvider,
      deepseekProvider,
      openrouterProvider,
      ollamaProvider,
      lmstudioProvider,
      dialProvider,
      moonshotProvider,
    ];

    for (const provider of providers) {
      expect(typeof provider.fetchModels).toBe("function");
      // Note: We don't actually call fetchModels here as it would make real API calls
    }
  });

  test("AbstractProvider should provide default implementations", () => {
    class TestProvider extends AbstractProvider {
      key = "test";
      name = "Test Provider";
      requiresApiKey = true;
      apiKeyEnvVar = "TEST_API_KEY";

      async canInitialize(): Promise<boolean> {
        return true;
      }

      async createProvider() {
        return (modelId: string) => ({ modelId });
      }

      async fetchModels() {
        return [];
      }
    }

    const testProvider = new TestProvider();
    expect(testProvider.key).toBe("test");
    expect(testProvider.name).toBe("Test Provider");
    expect(testProvider.requiresApiKey).toBe(true);
    expect(testProvider.apiKeyEnvVar).toBe("TEST_API_KEY");
    expect(typeof testProvider.healthCheck).toBe("function");
    expect(typeof testProvider.validateConfig).toBe("function");
  });

  test("allProviders registry should contain all provider instances", () => {
    expect(allProviders.openai).toBe(openaiProvider);
    expect(allProviders.anthropic).toBe(anthropicProvider);
    expect(allProviders.google).toBe(googleProvider);
    expect(allProviders.deepseek).toBe(deepseekProvider);
    expect(allProviders.openrouter).toBe(openrouterProvider);
    expect(allProviders.ollama).toBe(ollamaProvider);
    expect(allProviders.lmstudio).toBe(lmstudioProvider);
    expect(allProviders.dial).toBe(dialProvider);
    expect(allProviders.moonshot).toBe(moonshotProvider);
  });

  test("providerKeys should match allProviders keys", () => {
    const allProviderKeys = Object.keys(allProviders);
    expect(providerKeys.sort()).toEqual(allProviderKeys.sort());
  });
});
