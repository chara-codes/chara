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
    expect(typeof initializers.mistral).toBe("function");
    expect(typeof initializers.groq).toBe("function");
  });

  test("initializeProvider method should handle API key validation", () => {
    // Test with non-existent provider registry entry
    // @ts-ignore - Accessing private method for testing
    const result = providerConfigs.initializeProvider("non-existent-provider");
    expect(result).toBeNull();
  });

  test("registerProvider should add a new provider", () => {
    // Get initial provider count
    const initialCount = providerConfigs.getRegisteredProviderKeys().length;

    // Register a custom provider
    providerConfigs.registerProvider("custom-provider", {
      name: "Custom Provider",
      createProviderFn: () => () => ({ type: "custom" }),
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
    const provider = providerConfigs.getProvider("custom-provider");
    expect(provider).not.toBeNull();
    if (provider) {
      expect(provider.name).toBe("Custom Provider");
    }
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
