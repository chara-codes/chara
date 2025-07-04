import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { ProviderConfigs } from "../provider-configs";
import { logger } from "@chara/logger";

describe("ProviderConfigs", () => {
  let providerConfigs: ProviderConfigs;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    providerConfigs = new ProviderConfigs();
  });

  afterEach(() => {
    // Restore environment after each test
    process.env = originalEnv;
  });

  test("getAllProviderInitializers should return all provider methods", () => {
    const initializers = providerConfigs.getAllProviderInitializers();

    // Check if all expected providers are included
    expect(Object.keys(initializers).length).toBeGreaterThan(0);
    expect(typeof initializers.openai).toBe("function");
    expect(typeof initializers.anthropic).toBe("function");
    expect(typeof initializers.google).toBe("function");
    expect(typeof initializers.openrouter).toBe("function");
    expect(typeof initializers.ollama).toBe("function");
    expect(typeof initializers.lmstudio).toBe("function");
    expect(typeof initializers.dial).toBe("function");
  });

  test("initializeProvider method should handle API key validation", async () => {
    // Test with non-existent provider registry entry
    // @ts-ignore - Accessing private method for testing
    const result = await providerConfigs.initializeProvider(
      "non-existent-provider",
    );
    expect(result).toBeNull();
  });

  test("registerProvider should add a new provider", async () => {
    // Get initial provider count
    const initialCount = providerConfigs.getRegisteredProviderKeys().length;

    // Register a custom provider
    providerConfigs.registerProvider("custom-provider", {
      name: "Custom Provider",
      createProviderFn: () => () => ({ type: "custom" }),
      fetchModelsMethod: () => Promise.resolve([]),
      requiresApiKey: false,
    });

    // Check that provider count increased
    expect(providerConfigs.getRegisteredProviderKeys().length).toBe(
      initialCount + 1,
    );
    expect(providerConfigs.getRegisteredProviderKeys()).toContain(
      "custom-provider",
    );

    // Try to get the provider (should be null as no env vars are set)
    const provider = await providerConfigs.getProvider("custom-provider");
    expect(provider).not.toBeNull();
    if (provider) {
      expect(provider.name).toBe("Custom Provider");
    }
  });

  test("removed providers should not be available", () => {
    const initializers = providerConfigs.getAllProviderInitializers();

    // These providers were removed and should not be available
    expect(initializers.mistral).toBeUndefined();
    expect(initializers.groq).toBeUndefined();
    expect(initializers.xai).toBeUndefined();
    expect(initializers.bedrock).toBeUndefined();
    expect(initializers.huggingface).toBeUndefined();
  });

  test("getProvider should return null for removed providers", async () => {
    // These providers should return null since they were removed
    expect(await providerConfigs.getProvider("mistral")).toBeNull();
    expect(await providerConfigs.getProvider("groq")).toBeNull();
    expect(await providerConfigs.getProvider("xai")).toBeNull();
    expect(await providerConfigs.getProvider("bedrock")).toBeNull();
    expect(await providerConfigs.getProvider("huggingface")).toBeNull();
  });

  test("all remaining providers should have fetchModelsMethod", () => {
    const registeredKeys = providerConfigs.getRegisteredProviderKeys();

    // Check that we have the expected remaining providers
    expect(registeredKeys).toContain("openai");
    expect(registeredKeys).toContain("anthropic");
    expect(registeredKeys).toContain("google");
    expect(registeredKeys).toContain("openrouter");
    expect(registeredKeys).toContain("ollama");
    expect(registeredKeys).toContain("lmstudio");
    expect(registeredKeys).toContain("dial");

    // Verify removed providers are not in registered keys
    expect(registeredKeys).not.toContain("mistral");
    expect(registeredKeys).not.toContain("groq");
    expect(registeredKeys).not.toContain("xai");
    expect(registeredKeys).not.toContain("bedrock");
    expect(registeredKeys).not.toContain("huggingface");
  });

  test("provider initialization should work for remaining providers with proper env vars", async () => {
    // Set up environment variables for testing
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-key";
    process.env.OPEN_ROUTER_API_KEY = "test-openrouter-key";
    process.env.OLLAMA_API_BASE_URL = "http://localhost:11434";
    process.env.LMSTUDIO_API_BASE_URL = "http://localhost:1234/v1";
    process.env.DIAL_API_KEY = "test-dial-key";
    process.env.DIAL_API_BASE_URL = "http://localhost:8080";

    // Test that providers can be initialized
    const openaiProvider = await providerConfigs.getProvider("openai");
    const anthropicProvider = await providerConfigs.getProvider("anthropic");
    const googleProvider = await providerConfigs.getProvider("google");
    const openrouterProvider = await providerConfigs.getProvider("openrouter");
    const ollamaProvider = await providerConfigs.getProvider("ollama");
    const lmstudioProvider = await providerConfigs.getProvider("lmstudio");
    const dialProvider = await providerConfigs.getProvider("dial");

    expect(openaiProvider).not.toBeNull();
    expect(anthropicProvider).not.toBeNull();
    expect(googleProvider).not.toBeNull();
    expect(openrouterProvider).not.toBeNull();
    expect(ollamaProvider).not.toBeNull();
    expect(lmstudioProvider).not.toBeNull();
    expect(dialProvider).not.toBeNull();

    // Verify all providers have fetchModels method
    if (openaiProvider) expect(openaiProvider.fetchModels).toBeDefined();
    if (anthropicProvider) expect(anthropicProvider.fetchModels).toBeDefined();
    if (googleProvider) expect(googleProvider.fetchModels).toBeDefined();
    if (openrouterProvider)
      expect(openrouterProvider.fetchModels).toBeDefined();
    if (ollamaProvider) expect(ollamaProvider.fetchModels).toBeDefined();
    if (lmstudioProvider) expect(lmstudioProvider.fetchModels).toBeDefined();
    if (dialProvider) expect(dialProvider.fetchModels).toBeDefined();
  });

  test("registerProvider should validate input", () => {
    const initialKeys = providerConfigs.getRegisteredProviderKeys().length;

    // @ts-ignore - Testing invalid input
    providerConfigs.registerProvider(null, {});
    expect(providerConfigs.getRegisteredProviderKeys().length).toBe(
      initialKeys,
    );

    // @ts-ignore - Testing missing createProviderFn
    providerConfigs.registerProvider("invalid", { name: "Invalid" });
    expect(providerConfigs.getRegisteredProviderKeys().length).toBe(
      initialKeys,
    );
  });
});
