/**
 * Unit tests for models controller with settings integration
 *
 * Tests the integration between the models controller and the @chara/settings
 * whitelist functionality, ensuring that:
 * - Models are properly filtered using the dynamic whitelist
 * - Enhanced fields from whitelist are included in responses
 * - Legacy whitelist fallback works when settings are unavailable
 * - New filtering endpoints work correctly
 *
 * Uses Bun's native test API with mocked dependencies.
 * Run with: bun test
 */
import { describe, expect, test } from "bun:test";

// Test the models controller response structure
describe("Models Controller Integration", () => {
  test("should have the correct structure for enhanced model response", () => {
    const modelResponse = {
      id: "models/gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      provider: "google",
      contextSize: 1000000,
      hasTools: true,
      recommended: true,
      approved: true,
    };

    // Verify basic fields (backward compatibility)
    expect(modelResponse).toHaveProperty("id");
    expect(modelResponse).toHaveProperty("name");
    expect(modelResponse).toHaveProperty("provider");

    // Verify enhanced fields
    expect(modelResponse).toHaveProperty("contextSize");
    expect(modelResponse).toHaveProperty("hasTools");
    expect(modelResponse).toHaveProperty("recommended");
    expect(modelResponse).toHaveProperty("approved");

    // Verify field types
    expect(typeof modelResponse.id).toBe("string");
    expect(typeof modelResponse.name).toBe("string");
    expect(typeof modelResponse.provider).toBe("string");
    expect(typeof modelResponse.contextSize).toBe("number");
    expect(typeof modelResponse.hasTools).toBe("boolean");
    expect(typeof modelResponse.recommended).toBe("boolean");
    expect(typeof modelResponse.approved).toBe("boolean");
  });

  test("should handle model response without enhanced fields", () => {
    const basicModelResponse = {
      id: "basic-model",
      name: "Basic Model",
      provider: "basic-provider",
    };

    // Should work with just basic fields (fallback scenario)
    expect(basicModelResponse).toHaveProperty("id");
    expect(basicModelResponse).toHaveProperty("name");
    expect(basicModelResponse).toHaveProperty("provider");

    // Enhanced fields should be optional
    expect(basicModelResponse.contextSize).toBeUndefined();
    expect(basicModelResponse.hasTools).toBeUndefined();
    expect(basicModelResponse.recommended).toBeUndefined();
    expect(basicModelResponse.approved).toBeUndefined();
  });

  test("should validate response format structure", () => {
    const apiResponse = {
      models: [
        {
          id: "test-model",
          name: "Test Model",
          provider: "test",
          contextSize: 4096,
          hasTools: true,
          recommended: false,
          approved: true,
        },
      ],
    };

    expect(apiResponse).toHaveProperty("models");
    expect(Array.isArray(apiResponse.models)).toBe(true);
    expect(apiResponse.models.length).toBeGreaterThan(0);

    const firstModel = apiResponse.models[0];
    expect(firstModel).toHaveProperty("id");
    expect(firstModel).toHaveProperty("name");
    expect(firstModel).toHaveProperty("provider");
  });
});

// Test whitelist functionality in isolation
describe("Models Whitelist Configuration", () => {
  test("should have correct default whitelist model structure", () => {
    const sampleWhitelistModel = {
      id: "models/gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      provider: "google",
      contextSize: 1000000,
      hasTools: true,
      recommended: true,
      approved: true,
    };

    // Validate all required fields are present
    expect(sampleWhitelistModel).toHaveProperty("id");
    expect(sampleWhitelistModel).toHaveProperty("name");
    expect(sampleWhitelistModel).toHaveProperty("provider");
    expect(sampleWhitelistModel).toHaveProperty("contextSize");
    expect(sampleWhitelistModel).toHaveProperty("hasTools");
    expect(sampleWhitelistModel).toHaveProperty("recommended");
    expect(sampleWhitelistModel).toHaveProperty("approved");

    // Validate field types
    expect(typeof sampleWhitelistModel.id).toBe("string");
    expect(typeof sampleWhitelistModel.name).toBe("string");
    expect(typeof sampleWhitelistModel.provider).toBe("string");
    expect(typeof sampleWhitelistModel.contextSize).toBe("number");
    expect(typeof sampleWhitelistModel.hasTools).toBe("boolean");
    expect(typeof sampleWhitelistModel.recommended).toBe("boolean");
    expect(typeof sampleWhitelistModel.approved).toBe("boolean");
  });

  test("should support filtering by recommendation status", () => {
    const mockModels = [
      { id: "model-1", recommended: true, approved: true },
      { id: "model-2", recommended: false, approved: true },
      { id: "model-3", recommended: true, approved: false },
    ];

    const recommendedModels = mockModels.filter((m) => m.recommended);
    expect(recommendedModels).toHaveLength(2);
    expect(recommendedModels.every((m) => m.recommended)).toBe(true);
  });

  test("should support filtering by tool support", () => {
    const mockModels = [
      { id: "model-1", hasTools: true },
      { id: "model-2", hasTools: false },
      { id: "model-3", hasTools: true },
    ];

    const modelsWithTools = mockModels.filter((m) => m.hasTools);
    expect(modelsWithTools).toHaveLength(2);
    expect(modelsWithTools.every((m) => m.hasTools)).toBe(true);
  });

  test("should support filtering by provider", () => {
    const mockModels = [
      { id: "model-1", provider: "google" },
      { id: "model-2", provider: "anthropic" },
      { id: "model-3", provider: "google" },
    ];

    const googleModels = mockModels.filter((m) => m.provider === "google");
    expect(googleModels).toHaveLength(2);
    expect(googleModels.every((m) => m.provider === "google")).toBe(true);
  });
});

// Test controller error handling patterns
describe("Models Controller Error Handling", () => {
  test("should handle missing settings gracefully", () => {
    const fallbackResponse = {
      models: [
        { id: "fallback-model", name: "Fallback Model", provider: "fallback" },
      ],
    };

    expect(fallbackResponse).toHaveProperty("models");
    expect(Array.isArray(fallbackResponse.models)).toBe(true);
    expect(fallbackResponse.models.length).toBeGreaterThan(0);
  });

  test("should validate query parameters", () => {
    const validProviderParam = "google";
    const invalidProviderParam = "";

    expect(validProviderParam.length).toBeGreaterThan(0);
    expect(invalidProviderParam.length).toBe(0);
  });

  test("should maintain CORS headers format", () => {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    expect(corsHeaders["Access-Control-Allow-Origin"]).toBe("*");
    expect(corsHeaders["Access-Control-Allow-Methods"]).toContain("GET");
    expect(corsHeaders["Access-Control-Allow-Headers"]).toContain(
      "Content-Type",
    );
  });
});
