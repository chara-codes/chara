import { beforeEach, describe, expect, it } from "bun:test";
import { GeminiCLIProvider } from "../gemini-cli";

describe("GeminiCLIProvider", () => {
  let provider: GeminiCLIProvider;

  beforeEach(() => {
    provider = new GeminiCLIProvider();
  });

  it("should have correct provider metadata", () => {
    expect(provider.key).toBe("gemini-cli");
    expect(provider.name).toBe("Gemini CLI");
    expect(provider.requiresApiKey).toBe(true); // API key is preferred
    expect(provider.apiKeyEnvVar).toBe("GEMINI_API_KEY");
  });

  it("should implement BaseProvider interface", () => {
    expect(typeof provider.canInitialize).toBe("function");
    expect(typeof provider.createProvider).toBe("function");
    expect(typeof provider.fetchModels).toBe("function");
    expect(typeof provider.healthCheck).toBe("function");
  });

  it("should fetch predefined models", async () => {
    const models = await provider.fetchModels();

    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBe(2);

    const proModel = models.find((m) => m.id === "gemini-2.5-pro");
    const flashModel = models.find((m) => m.id === "gemini-2.5-flash");

    expect(proModel).toBeDefined();
    expect(proModel?.name).toBe("Gemini 2.5 Pro");
    expect(proModel?.description).toContain("Most capable model");
    expect(proModel?.contextLength).toBe(2097152);

    expect(flashModel).toBeDefined();
    expect(flashModel?.name).toBe("Gemini 2.5 Flash");
    expect(flashModel?.description).toContain("Faster model");
    expect(flashModel?.contextLength).toBe(1048576);
  });

  it("should have working health check", async () => {
    // Health check should work since fetchModels returns static data
    const isHealthy = await provider.healthCheck();
    expect(typeof isHealthy).toBe("boolean");
    expect(isHealthy).toBe(true);
  });

  it("should handle canInitialize gracefully", async () => {
    // This test may pass or fail depending on environment setup
    // but it should not throw an error
    const canInit = await provider.canInitialize();
    expect(typeof canInit).toBe("boolean");
  });
});
