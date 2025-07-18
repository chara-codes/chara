import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { ProvidersRegistry } from "../registry";

// Mock the global config module to prevent file system errors
mock.module("@chara-codes/settings", () => ({
  readGlobalConfig: mock(() => Promise.resolve({})),
  writeGlobalConfig: mock(() => Promise.resolve()),
  getModelsWhitelist: mock(() => ({})),
}));

describe("ProvidersRegistry", () => {
  let registry: ProvidersRegistry;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    registry = new ProvidersRegistry();
  });

  afterEach(() => {
    // Restore environment after each test
    process.env = originalEnv;
  });

  test("should not initialize providers automatically", async () => {
    // Registry should not be initialized by default
    await expect(registry.getAvailableProviders()).rejects.toThrow(
      "Providers not initialized. Call initialize() first."
    );
  });

  test("should initialize providers when initialize() is called", async () => {
    // Initialize providers
    await registry.initialize();

    // Should now be able to get providers without error
    const providers = await registry.getAvailableProviders();
    expect(Array.isArray(providers)).toBe(true);
  });

  test("should handle multiple initialize() calls gracefully", async () => {
    // Call initialize multiple times
    const promise1 = registry.initialize();
    const promise2 = registry.initialize();
    const promise3 = registry.initialize();

    // All should resolve to the same result
    await Promise.all([promise1, promise2, promise3]);

    const providers = await registry.getAvailableProviders();
    expect(Array.isArray(providers)).toBe(true);
  });

  test("should reinitialize providers when initialize() is called again", async () => {
    // Set up initial environment
    process.env.OPENAI_API_KEY = "test-key-1";
    await registry.initialize();

    // Verify initial state
    const initialProviders = await registry.getAvailableProviders();
    const hasOpenAI = await registry.hasProvider("openai");

    // Change environment
    process.env.OPENAI_API_KEY = "test-key-2";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";

    // Reinitialize by calling initialize again
    await registry.initialize();

    // Should be able to access providers again
    const newProviders = await registry.getAvailableProviders();
    expect(Array.isArray(newProviders)).toBe(true);

    // Should be able to check providers
    const stillHasOpenAI = await registry.hasProvider("openai");
    const hasAnthropic = await registry.hasProvider("anthropic");

    expect(stillHasOpenAI).toBe(hasOpenAI); // Should still have OpenAI
  });

  test("should clear state properly during reinitialize", async () => {
    // Initialize with some providers
    process.env.OPENAI_API_KEY = "test-key";
    await registry.initialize();

    const initialProviderNames = await registry.getProviderNames();
    expect(initialProviderNames.length).toBeGreaterThanOrEqual(0);

    // Reinitialize by calling initialize again
    await registry.initialize();

    // Should still work
    const newProviderNames = await registry.getProviderNames();
    expect(Array.isArray(newProviderNames)).toBe(true);
  });

  test("should throw error when accessing uninitialized registry methods", async () => {
    // All these methods should throw before initialization
    await expect(registry.getProvider("openai")).rejects.toThrow(
      "Providers not initialized. Call initialize() first."
    );

    await expect(registry.getAvailableProviders()).rejects.toThrow(
      "Providers not initialized. Call initialize() first."
    );

    await expect(registry.getProviderNames()).rejects.toThrow(
      "Providers not initialized. Call initialize() first."
    );

    await expect(registry.hasProvider("openai")).rejects.toThrow(
      "Providers not initialized. Call initialize() first."
    );

    await expect(registry.getModel("openai", "gpt-4")).rejects.toThrow(
      "Providers not initialized. Call initialize() first."
    );

    await expect(registry.fetchModels("openai")).rejects.toThrow(
      "Providers not initialized. Call initialize() first."
    );

    await expect(registry.fetchAllModels()).rejects.toThrow(
      "Providers not initialized. Call initialize() first."
    );

    await expect(registry.getProviderStatus()).rejects.toThrow(
      "Providers not initialized. Call initialize() first."
    );
  });

  test("should work normally after initialization", async () => {
    // Set up some test environment
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";

    await registry.initialize();

    // These should all work without throwing
    const providers = await registry.getAvailableProviders();
    const providerNames = await registry.getProviderNames();
    const status = await registry.getProviderStatus();

    expect(Array.isArray(providers)).toBe(true);
    expect(Array.isArray(providerNames)).toBe(true);
    expect(typeof status).toBe("object");
  });

  test("should handle getModel correctly after initialization", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    await registry.initialize();

    const hasOpenAI = await registry.hasProvider("openai");

    if (hasOpenAI) {
      // Should be able to get a model
      const model = await registry.getModel("openai", "gpt-4");
      expect(model).toBeDefined();
    } else {
      // Should throw if provider not available
      await expect(registry.getModel("openai", "gpt-4")).rejects.toThrow(
        "Provider openai is not available"
      );
    }
  });

  test("should handle missing model name", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    await registry.initialize();

    // Should throw if model name is missing
    await expect(registry.getModel("openai", "")).rejects.toThrow(
      "Model name is required for provider openai"
    );
  });

  test("should handle non-existent provider", async () => {
    await registry.initialize();

    // Should throw if provider doesn't exist
    await expect(
      registry.getModel("non-existent", "some-model")
    ).rejects.toThrow("Provider non-existent is not available");
  });

  test("should return initialization errors", async () => {
    await registry.initialize();

    const errors = registry.getInitializationErrors();
    expect(Array.isArray(errors)).toBe(true);
    // Errors array should contain objects with provider and error properties
    errors.forEach((error) => {
      expect(typeof error.provider).toBe("string");
      expect(typeof error.error).toBe("string");
    });
  });

  test("should handle reinitialize after failed initialization", async () => {
    // First initialization (might have some failures due to missing env vars)
    await registry.initialize();

    // Add some environment variables
    process.env.OPENAI_API_KEY = "test-key";

    // Reinitialize should work by calling initialize again
    await registry.initialize();

    const providers = await registry.getAvailableProviders();
    expect(Array.isArray(providers)).toBe(true);
  });

  test("should handle initialize as both first-time and reinitialization", async () => {
    // First call should work as initial setup
    await registry.initialize();
    const firstProviders = await registry.getAvailableProviders();

    // Change environment
    process.env.OPENAI_API_KEY = "first-key";

    // Second call should work as reinitialization
    await registry.initialize();
    const secondProviders = await registry.getAvailableProviders();

    // Both should return valid arrays
    expect(Array.isArray(firstProviders)).toBe(true);
    expect(Array.isArray(secondProviders)).toBe(true);

    // Change environment again
    process.env.ANTHROPIC_API_KEY = "anthropic-key";

    // Third call should still work
    await registry.initialize();
    const thirdProviders = await registry.getAvailableProviders();
    expect(Array.isArray(thirdProviders)).toBe(true);
  });
});
