/**
 * Unit tests for models utility functions
 *
 * Tests the complete lifecycle of models whitelist management including:
 * - Default models whitelist
 * - Custom models management
 * - Whitelist operations
 * - Model filtering and querying
 * - Error handling
 *
 * Uses Bun's native test API and mocks the environment utility.
 * Run with: bun test
 */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import {
  addCustomModel,
  DEFAULT_MODELS_WHITELIST,
  findModelById,
  getApprovedModels,
  getCustomModels,
  getModelsByProvider,
  getModelsWhitelist,
  getModelsWithTools,
  getRecommendedModels,
  isModelWhitelisted,
  type ModelConfig,
  removeCustomModel,
  resetModelsWhitelist,
  setModelsWhitelist,
} from "../models";

// Mock the env utility to use isolated test directory
const testHomeDir = "/tmp/test-home-bun-models";
let testCounter = 0;

const mockEnv = mock(() => ({
  publicUrl: "http://localhost:3000",
  apiUrl: "http://localhost:3001",
  homeDir: testHomeDir,
}));

mock.module("../env", () => ({
  env: mockEnv,
}));

describe("Models Whitelist Management", () => {
  let testConfigFile: string;
  let testConfigPath: string;

  beforeEach(() => {
    // Generate unique config file for each test
    testCounter++;
    testConfigFile = `.test-models-chararc-${testCounter}`;
    testConfigPath = resolve(testHomeDir, testConfigFile);

    // Ensure test directory exists
    if (!existsSync(testHomeDir)) {
      mkdirSync(testHomeDir, { recursive: true });
    }

    // Clean up any existing test config
    try {
      unlinkSync(testConfigPath);
    } catch {
      // File might not exist, ignore error
    }
  });

  afterEach(() => {
    // Clean up after each test
    try {
      unlinkSync(testConfigPath);
    } catch {
      // File might not exist, ignore error
    }
  });

  describe("DEFAULT_MODELS_WHITELIST", () => {
    test("should have valid structure", () => {
      expect(DEFAULT_MODELS_WHITELIST).toBeArray();
      expect(DEFAULT_MODELS_WHITELIST.length).toBeGreaterThan(0);

      // Test first model has required fields
      const firstModel = DEFAULT_MODELS_WHITELIST[0];
      expect(firstModel).toHaveProperty("id");
      expect(firstModel).toHaveProperty("name");
      expect(firstModel).toHaveProperty("provider");
      expect(firstModel).toHaveProperty("contextSize");
      expect(firstModel).toHaveProperty("hasTools");
      expect(firstModel).toHaveProperty("recommended");
      expect(firstModel).toHaveProperty("approved");
    });

    test("should contain expected model types", () => {
      const providers = DEFAULT_MODELS_WHITELIST.map((m) => m.provider);
      expect(providers).toContain("google");
      expect(providers).toContain("anthropic");
      expect(providers).toContain("openai");
      expect(providers).toContain("openrouter");
    });

    test("should have recommended models", () => {
      const recommendedModels = DEFAULT_MODELS_WHITELIST.filter(
        (m) => m.recommended,
      );
      expect(recommendedModels.length).toBeGreaterThan(0);
    });

    test("should have approved models", () => {
      const approvedModels = DEFAULT_MODELS_WHITELIST.filter((m) => m.approved);
      expect(approvedModels.length).toBeGreaterThan(0);
    });
  });

  describe("getModelsWhitelist", () => {
    test("should return default whitelist when no config exists", async () => {
      const whitelist = await getModelsWhitelist(testConfigFile);
      expect(whitelist).toEqual(DEFAULT_MODELS_WHITELIST);
    });

    test("should return custom whitelist when configured", async () => {
      const customWhitelist: ModelConfig[] = [
        {
          id: "custom-model-1",
          name: "Custom Model 1",
          provider: "custom",
          contextSize: 4096,
          hasTools: true,
          recommended: true,
          approved: true,
        },
      ];

      await setModelsWhitelist(customWhitelist, testConfigFile);
      const whitelist = await getModelsWhitelist(testConfigFile);
      expect(whitelist).toEqual(customWhitelist);
    });

    test("should include custom models with default whitelist", async () => {
      const customModel: ModelConfig = {
        id: "custom-model-2",
        name: "Custom Model 2",
        provider: "custom",
        contextSize: 8192,
        hasTools: false,
        recommended: false,
        approved: true,
      };

      await addCustomModel(customModel, testConfigFile);
      const whitelist = await getModelsWhitelist(testConfigFile);

      expect(whitelist.find((m) => m.id === customModel.id)).toBeDefined();
      expect(whitelist.length).toBe(DEFAULT_MODELS_WHITELIST.length + 1);
    });
  });

  describe("setModelsWhitelist", () => {
    test("should set custom whitelist", async () => {
      const customWhitelist: ModelConfig[] = [
        {
          id: "test-model",
          name: "Test Model",
          provider: "test",
          contextSize: 2048,
          hasTools: false,
          recommended: false,
          approved: true,
        },
      ];

      await setModelsWhitelist(customWhitelist, testConfigFile);
      const whitelist = await getModelsWhitelist(testConfigFile);
      expect(whitelist).toEqual(customWhitelist);
    });

    test("should replace existing whitelist", async () => {
      const firstWhitelist: ModelConfig[] = [
        {
          id: "first-model",
          name: "First Model",
          provider: "first",
          contextSize: 1024,
          hasTools: true,
          recommended: true,
          approved: true,
        },
      ];

      const secondWhitelist: ModelConfig[] = [
        {
          id: "second-model",
          name: "Second Model",
          provider: "second",
          contextSize: 2048,
          hasTools: false,
          recommended: false,
          approved: true,
        },
      ];

      await setModelsWhitelist(firstWhitelist, testConfigFile);
      await setModelsWhitelist(secondWhitelist, testConfigFile);

      const whitelist = await getModelsWhitelist(testConfigFile);
      expect(whitelist).toEqual(secondWhitelist);
      expect(whitelist).not.toContain(firstWhitelist[0]);
    });
  });

  describe("addCustomModel", () => {
    test("should add new custom model", async () => {
      const customModel: ModelConfig = {
        id: "new-custom-model",
        name: "New Custom Model",
        provider: "custom",
        contextSize: 16384,
        hasTools: true,
        recommended: true,
        approved: true,
      };

      await addCustomModel(customModel, testConfigFile);
      const customModels = await getCustomModels(testConfigFile);

      expect(customModels.find((m) => m.id === customModel.id)).toBeDefined();
      expect(customModels.length).toBe(1);
    });

    test("should update existing custom model", async () => {
      const originalModel: ModelConfig = {
        id: "update-test-model",
        name: "Original Name",
        provider: "original",
        contextSize: 1024,
        hasTools: false,
        recommended: false,
        approved: true,
      };

      const updatedModel: ModelConfig = {
        id: "update-test-model",
        name: "Updated Name",
        provider: "updated",
        contextSize: 2048,
        hasTools: true,
        recommended: true,
        approved: true,
      };

      await addCustomModel(originalModel, testConfigFile);
      await addCustomModel(updatedModel, testConfigFile);

      const customModels = await getCustomModels(testConfigFile);
      expect(customModels.length).toBe(1);
      expect(customModels[0]).toEqual(updatedModel);
    });

    test("should add multiple custom models", async () => {
      const model1: ModelConfig = {
        id: "multi-model-1",
        name: "Multi Model 1",
        provider: "multi",
        contextSize: 4096,
        hasTools: true,
        recommended: true,
        approved: true,
      };

      const model2: ModelConfig = {
        id: "multi-model-2",
        name: "Multi Model 2",
        provider: "multi",
        contextSize: 8192,
        hasTools: false,
        recommended: false,
        approved: true,
      };

      await addCustomModel(model1, testConfigFile);
      await addCustomModel(model2, testConfigFile);

      const customModels = await getCustomModels(testConfigFile);
      expect(customModels.length).toBe(2);
      expect(customModels.find((m) => m.id === model1.id)).toBeDefined();
      expect(customModels.find((m) => m.id === model2.id)).toBeDefined();
    });
  });

  describe("removeCustomModel", () => {
    test("should remove existing custom model", async () => {
      const customModel: ModelConfig = {
        id: "remove-test-model",
        name: "Remove Test Model",
        provider: "test",
        contextSize: 4096,
        hasTools: true,
        recommended: true,
        approved: true,
      };

      await addCustomModel(customModel, testConfigFile);
      let customModels = await getCustomModels(testConfigFile);
      expect(customModels.find((m) => m.id === customModel.id)).toBeDefined();

      await removeCustomModel("remove-test-model", testConfigFile);
      customModels = await getCustomModels(testConfigFile);
      expect(customModels.find((m) => m.id === customModel.id)).toBeUndefined();
      expect(customModels.length).toBe(0);
    });

    test("should handle removal of non-existent model", async () => {
      await removeCustomModel("non-existent-model", testConfigFile);
      const customModels = await getCustomModels(testConfigFile);
      expect(customModels.length).toBe(0);
    });

    test("should only remove specified model", async () => {
      const model1: ModelConfig = {
        id: "keep-model",
        name: "Keep Model",
        provider: "keep",
        contextSize: 4096,
        hasTools: true,
        recommended: true,
        approved: true,
      };

      const model2: ModelConfig = {
        id: "remove-model",
        name: "Remove Model",
        provider: "remove",
        contextSize: 8192,
        hasTools: false,
        recommended: false,
        approved: true,
      };

      await addCustomModel(model1, testConfigFile);
      await addCustomModel(model2, testConfigFile);
      await removeCustomModel("remove-model", testConfigFile);

      const customModels = await getCustomModels(testConfigFile);
      expect(customModels.length).toBe(1);
      expect(customModels.find((m) => m.id === model1.id)).toBeDefined();
      expect(customModels.find((m) => m.id === model2.id)).toBeUndefined();
    });
  });

  describe("getCustomModels", () => {
    test("should return empty array when no custom models", async () => {
      const customModels = await getCustomModels(testConfigFile);
      expect(customModels).toEqual([]);
    });

    test("should return all custom models", async () => {
      const model1: ModelConfig = {
        id: "custom-1",
        name: "Custom 1",
        provider: "custom",
        contextSize: 4096,
        hasTools: true,
        recommended: true,
        approved: true,
      };

      const model2: ModelConfig = {
        id: "custom-2",
        name: "Custom 2",
        provider: "custom",
        contextSize: 8192,
        hasTools: false,
        recommended: false,
        approved: true,
      };

      await addCustomModel(model1, testConfigFile);
      await addCustomModel(model2, testConfigFile);

      const customModels = await getCustomModels(testConfigFile);
      expect(customModels.length).toBe(2);
      expect(customModels.find((m) => m.id === model1.id)).toBeDefined();
      expect(customModels.find((m) => m.id === model2.id)).toBeDefined();
    });
  });

  describe("resetModelsWhitelist", () => {
    test("should reset to default whitelist", async () => {
      const customWhitelist: ModelConfig[] = [
        {
          id: "custom-model",
          name: "Custom Model",
          provider: "custom",
          contextSize: 4096,
          hasTools: true,
          recommended: true,
          approved: true,
        },
      ];

      await setModelsWhitelist(customWhitelist, testConfigFile);
      await resetModelsWhitelist(testConfigFile);

      const whitelist = await getModelsWhitelist(testConfigFile);
      expect(whitelist).toEqual(DEFAULT_MODELS_WHITELIST);
    });

    test("should clear custom models", async () => {
      const customModel: ModelConfig = {
        id: "clear-custom",
        name: "Clear Custom",
        provider: "custom",
        contextSize: 4096,
        hasTools: true,
        recommended: true,
        approved: true,
      };

      await addCustomModel(customModel, testConfigFile);
      await resetModelsWhitelist(testConfigFile);

      const customModels = await getCustomModels(testConfigFile);
      expect(customModels).toEqual([]);
    });
  });

  describe("getRecommendedModels", () => {
    test("should return only recommended models", async () => {
      const recommendedModels = await getRecommendedModels(testConfigFile);

      expect(recommendedModels.length).toBeGreaterThan(0);
      recommendedModels.forEach((model) => {
        expect(model.recommended).toBe(true);
      });
    });

    test("should include custom recommended models", async () => {
      const customRecommendedModel: ModelConfig = {
        id: "custom-recommended",
        name: "Custom Recommended",
        provider: "custom",
        contextSize: 4096,
        hasTools: true,
        recommended: true,
        approved: true,
      };

      await addCustomModel(customRecommendedModel, testConfigFile);
      const recommendedModels = await getRecommendedModels(testConfigFile);

      expect(
        recommendedModels.find((m) => m.id === customRecommendedModel.id),
      ).toBeDefined();
    });
  });

  describe("getApprovedModels", () => {
    test("should return only approved models", async () => {
      const approvedModels = await getApprovedModels(testConfigFile);

      expect(approvedModels.length).toBeGreaterThan(0);
      approvedModels.forEach((model) => {
        expect(model.approved).toBe(true);
      });
    });
  });

  describe("getModelsByProvider", () => {
    test("should return models for specific provider", async () => {
      const googleModels = await getModelsByProvider("google", testConfigFile);

      expect(googleModels.length).toBeGreaterThan(0);
      googleModels.forEach((model) => {
        expect(model.provider).toBe("google");
      });
    });

    test("should return empty array for non-existent provider", async () => {
      const nonExistentModels = await getModelsByProvider(
        "non-existent",
        testConfigFile,
      );
      expect(nonExistentModels).toEqual([]);
    });

    test("should include custom models for provider", async () => {
      const customModel: ModelConfig = {
        id: "custom-google",
        name: "Custom Google",
        provider: "google",
        contextSize: 4096,
        hasTools: true,
        recommended: true,
        approved: true,
      };

      await addCustomModel(customModel, testConfigFile);
      const googleModels = await getModelsByProvider("google", testConfigFile);

      expect(googleModels.find((m) => m.id === customModel.id)).toBeDefined();
    });
  });

  describe("getModelsWithTools", () => {
    test("should return only models with tools", async () => {
      const modelsWithTools = await getModelsWithTools(testConfigFile);

      expect(modelsWithTools.length).toBeGreaterThan(0);
      modelsWithTools.forEach((model) => {
        expect(model.hasTools).toBe(true);
      });
    });

    test("should include custom models with tools", async () => {
      const customModelWithTools: ModelConfig = {
        id: "custom-with-tools",
        name: "Custom With Tools",
        provider: "custom",
        contextSize: 4096,
        hasTools: true,
        recommended: true,
        approved: true,
      };

      await addCustomModel(customModelWithTools, testConfigFile);
      const modelsWithTools = await getModelsWithTools(testConfigFile);

      expect(
        modelsWithTools.find((m) => m.id === customModelWithTools.id),
      ).toBeDefined();
    });
  });

  describe("findModelById", () => {
    test("should find existing model by ID", async () => {
      const firstModel = DEFAULT_MODELS_WHITELIST[0];
      if (!firstModel) {
        throw new Error("DEFAULT_MODELS_WHITELIST is empty");
      }
      const foundModel = await findModelById(firstModel.id, testConfigFile);

      expect(foundModel).toEqual(firstModel);
    });

    test("should return undefined for non-existent model", async () => {
      const foundModel = await findModelById(
        "non-existent-model",
        testConfigFile,
      );
      expect(foundModel).toBeUndefined();
    });

    test("should find custom model by ID", async () => {
      const customModel: ModelConfig = {
        id: "findable-custom",
        name: "Findable Custom",
        provider: "custom",
        contextSize: 4096,
        hasTools: true,
        recommended: true,
        approved: true,
      };

      await addCustomModel(customModel, testConfigFile);
      const foundModel = await findModelById("findable-custom", testConfigFile);

      expect(foundModel).toEqual(customModel);
    });
  });

  describe("isModelWhitelisted", () => {
    test("should return true for whitelisted model", async () => {
      const firstModel = DEFAULT_MODELS_WHITELIST[0];
      if (!firstModel) {
        throw new Error("DEFAULT_MODELS_WHITELIST is empty");
      }
      const isWhitelisted = await isModelWhitelisted(
        firstModel.id,
        testConfigFile,
      );

      expect(isWhitelisted).toBe(true);
    });

    test("should return false for non-whitelisted model", async () => {
      const isWhitelisted = await isModelWhitelisted(
        "non-whitelisted-model",
        testConfigFile,
      );
      expect(isWhitelisted).toBe(false);
    });

    test("should return true for custom model", async () => {
      const customModel: ModelConfig = {
        id: "whitelisted-custom",
        name: "Whitelisted Custom",
        provider: "custom",
        contextSize: 4096,
        hasTools: true,
        recommended: true,
        approved: true,
      };

      await addCustomModel(customModel, testConfigFile);
      const isWhitelisted = await isModelWhitelisted(
        "whitelisted-custom",
        testConfigFile,
      );

      expect(isWhitelisted).toBe(true);
    });
  });

  describe("integration tests", () => {
    test("should handle complete models lifecycle", async () => {
      // Start with default whitelist
      let whitelist = await getModelsWhitelist(testConfigFile);
      expect(whitelist).toEqual(DEFAULT_MODELS_WHITELIST);

      // Add custom model
      const customModel: ModelConfig = {
        id: "lifecycle-test",
        name: "Lifecycle Test",
        provider: "test",
        contextSize: 4096,
        hasTools: true,
        recommended: true,
        approved: true,
      };

      await addCustomModel(customModel, testConfigFile);
      whitelist = await getModelsWhitelist(testConfigFile);
      expect(whitelist.find((m) => m.id === customModel.id)).toBeDefined();

      // Set custom whitelist
      const customWhitelist: ModelConfig[] = [customModel];
      await setModelsWhitelist(customWhitelist, testConfigFile);
      whitelist = await getModelsWhitelist(testConfigFile);
      expect(whitelist).toEqual([customModel]);

      // Reset to default
      await resetModelsWhitelist(testConfigFile);
      whitelist = await getModelsWhitelist(testConfigFile);
      expect(whitelist).toEqual(DEFAULT_MODELS_WHITELIST);
    });

    test("should handle error conditions gracefully", async () => {
      // Test functions with no config file
      const customModels = await getCustomModels(testConfigFile);
      expect(customModels).toEqual([]);

      const recommendedModels = await getRecommendedModels(testConfigFile);
      expect(recommendedModels.length).toBeGreaterThan(0);

      const isWhitelisted = await isModelWhitelisted(
        "test-model",
        testConfigFile,
      );
      expect(isWhitelisted).toBe(false);
    });
  });
});
