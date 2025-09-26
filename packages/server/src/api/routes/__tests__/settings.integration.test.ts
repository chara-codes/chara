import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { createTRPCMsw } from "msw-trpc";
import { settingsRouter } from "../settings";
import { createContext } from "../../context";
import { SettingsService } from "../../../services/settingsService";
import { SettingsErrorType, type CreateProviderInput } from "../../../types/settings";
import * as settingsModule from "@chara-codes/settings";
import * as agentsModule from "@chara-codes/agents";

// Mock the @chara-codes/settings module
const mockReadGlobalConfig = mock(() => Promise.resolve({}));
const mockWriteGlobalConfig = mock(() => Promise.resolve());
const mockUpdateGlobalConfig = mock(() => Promise.resolve());
const mockExistsGlobalConfig = mock(() => Promise.resolve(true));

// Mock the @chara-codes/agents module
const mockFetchAllModels = mock(() => Promise.resolve({}));

// Mock the settings module functions
mock.module("@chara-codes/settings", () => ({
  readGlobalConfig: mockReadGlobalConfig,
  writeGlobalConfig: mockWriteGlobalConfig,
  updateGlobalConfig: mockUpdateGlobalConfig,
  existsGlobalConfig: mockExistsGlobalConfig,
}));

// Mock the agents module functions
mock.module("@chara-codes/agents", () => ({
  providersRegistry: {
    fetchAllModels: mockFetchAllModels,
  },
}));

// Create a test caller for the TRPC router
const createCaller = (ctx: any) => {
  return settingsRouter.createCaller(ctx);
};

describe("Settings TRPC Integration", () => {
  let caller: ReturnType<typeof createCaller>;
  let mockContext: any;

  beforeEach(() => {
    // Create mock context
    mockContext = {};
    caller = createCaller(mockContext);

    // Reset all mocks
    mockReadGlobalConfig.mockClear();
    mockWriteGlobalConfig.mockClear();
    mockUpdateGlobalConfig.mockClear();
    mockExistsGlobalConfig.mockClear();
    mockFetchAllModels.mockClear();
  });

  afterEach(() => {
    // Clean up any side effects
  });

  describe("Provider Management Endpoints", () => {
    describe("providers.list", () => {
      test("should return list of providers", async () => {
        const mockProviders = {
          "provider1": {
            id: "provider1",
            name: "Test Provider",
            type: "openai",
            enabled: true,
            configuration: { apiKey: "sk-test" },
            requiredFields: ["apiKey"],
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01")
          }
        };

        mockExistsGlobalConfig.mockResolvedValueOnce(true);
        mockReadGlobalConfig.mockResolvedValueOnce({ providers: mockProviders });

        const result = await caller.providers.list();

        expect(result).toEqual([mockProviders.provider1]);
      });

      test("should return empty array when no providers exist", async () => {
        mockExistsGlobalConfig.mockResolvedValueOnce(false);

        const result = await caller.providers.list();

        expect(result).toEqual([]);
      });

      test("should handle errors gracefully", async () => {
        mockExistsGlobalConfig.mockResolvedValueOnce(true);
        mockReadGlobalConfig.mockRejectedValueOnce(new Error("Read failed"));

        await expect(caller.providers.list()).rejects.toThrow();
      });
    });

    describe("providers.create", () => {
      test("should create a new OpenAI provider", async () => {
        const input: CreateProviderInput = {
          name: "My OpenAI",
          type: "openai",
          enabled: true,
          configuration: { apiKey: "sk-test123" }
        };

        mockReadGlobalConfig.mockResolvedValueOnce({});
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        const result = await caller.providers.create(input);

        expect(result.name).toBe("My OpenAI");
        expect(result.type).toBe("openai");
        expect(result.enabled).toBe(true);
        expect(result.configuration.apiKey).toBe("sk-test123");
        expect(result.id).toMatch(/^openai_\d+_/);
        expect(mockUpdateGlobalConfig).toHaveBeenCalled();
      });

      test("should create a new Anthropic provider", async () => {
        const input: CreateProviderInput = {
          name: "My Anthropic",
          type: "anthropic",
          enabled: true,
          configuration: { apiKey: "sk-ant-test123" }
        };

        mockReadGlobalConfig.mockResolvedValueOnce({});
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        const result = await caller.providers.create(input);

        expect(result.name).toBe("My Anthropic");
        expect(result.type).toBe("anthropic");
        expect(result.configuration.apiKey).toBe("sk-ant-test123");
      });

      test("should validate input and reject invalid provider", async () => {
        const input: CreateProviderInput = {
          name: "Invalid Provider",
          type: "openai",
          enabled: true,
          configuration: {} // Missing required apiKey
        };

        await expect(caller.providers.create(input)).rejects.toThrow();
      });

      test("should validate API key format for OpenAI", async () => {
        const input: CreateProviderInput = {
          name: "Invalid OpenAI",
          type: "openai",
          enabled: true,
          configuration: { apiKey: "invalid-key" }
        };

        await expect(caller.providers.create(input)).rejects.toThrow();
      });

      test("should validate API key format for Anthropic", async () => {
        const input: CreateProviderInput = {
          name: "Invalid Anthropic",
          type: "anthropic",
          enabled: true,
          configuration: { apiKey: "sk-invalid" }
        };

        await expect(caller.providers.create(input)).rejects.toThrow();
      });
    });

    describe("providers.update", () => {
      test("should update existing provider", async () => {
        const existingProvider = {
          id: "provider1",
          name: "Old Name",
          type: "openai" as const,
          enabled: true,
          configuration: { apiKey: "sk-old" },
          requiredFields: ["apiKey"],
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01")
        };

        mockReadGlobalConfig.mockResolvedValueOnce({
          providers: { provider1: existingProvider }
        });
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        const input = {
          id: "provider1",
          updates: {
            name: "New Name",
            configuration: { apiKey: "sk-new123" }
          }
        };

        const result = await caller.providers.update(input);

        expect(result.name).toBe("New Name");
        expect(result.configuration.apiKey).toBe("sk-new123");
        expect(result.id).toBe("provider1");
        expect(mockUpdateGlobalConfig).toHaveBeenCalled();
      });

      test("should reject update for non-existent provider", async () => {
        mockReadGlobalConfig.mockResolvedValueOnce({ providers: {} });

        const input = {
          id: "nonexistent",
          updates: { name: "New Name" }
        };

        await expect(caller.providers.update(input)).rejects.toThrow();
      });

      test("should validate configuration on update", async () => {
        const existingProvider = {
          id: "provider1",
          name: "Test Provider",
          type: "openai" as const,
          enabled: true,
          configuration: { apiKey: "sk-valid" },
          requiredFields: ["apiKey"],
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01")
        };

        mockReadGlobalConfig.mockResolvedValueOnce({
          providers: { provider1: existingProvider }
        });

        const input = {
          id: "provider1",
          updates: {
            configuration: { apiKey: "invalid-key" }
          }
        };

        await expect(caller.providers.update(input)).rejects.toThrow();
      });
    });

    describe("providers.delete", () => {
      test("should delete existing provider", async () => {
        const existingProvider = {
          id: "provider1",
          name: "Test Provider",
          type: "openai" as const,
          enabled: true,
          configuration: { apiKey: "sk-test" },
          requiredFields: ["apiKey"],
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01")
        };

        mockReadGlobalConfig.mockResolvedValueOnce({
          providers: { provider1: existingProvider },
          models: { enabled: ["model1", "model2"] }
        });
        mockFetchAllModels.mockResolvedValueOnce({
          openai: [{ id: "model1", name: "GPT-4" }],
          anthropic: [{ id: "model2", name: "Claude" }]
        });
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        const result = await caller.providers.delete({ id: "provider1" });

        expect(result).toEqual({ success: true });
        expect(mockUpdateGlobalConfig).toHaveBeenCalledWith({
          providers: {},
          models: { enabled: ["model2"] }
        }, ".chararc");
      });

      test("should reject deletion of non-existent provider", async () => {
        mockReadGlobalConfig.mockResolvedValueOnce({ providers: {} });

        await expect(
          caller.providers.delete({ id: "nonexistent" })
        ).rejects.toThrow();
      });
    });

    describe("providers.getByType", () => {
      test("should filter providers by type", async () => {
        const providers = {
          provider1: {
            id: "provider1",
            name: "OpenAI 1",
            type: "openai" as const,
            enabled: true,
            configuration: {},
            requiredFields: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          provider2: {
            id: "provider2",
            name: "Anthropic 1",
            type: "anthropic" as const,
            enabled: true,
            configuration: {},
            requiredFields: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          provider3: {
            id: "provider3",
            name: "OpenAI 2",
            type: "openai" as const,
            enabled: false,
            configuration: {},
            requiredFields: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };

        mockExistsGlobalConfig.mockResolvedValueOnce(true);
        mockReadGlobalConfig.mockResolvedValueOnce({ providers });

        const result = await caller.providers.getByType({ type: "openai" });

        expect(result).toHaveLength(2);
        expect(result[0].type).toBe("openai");
        expect(result[1].type).toBe("openai");
      });
    });
  });

  describe("Model Management Endpoints", () => {
    describe("models.getAvailable", () => {
      test("should return available models", async () => {
        const mockProviderModels = {
          openai: [
            { id: "gpt-4", name: "GPT-4", contextLength: 8192 }
          ],
          anthropic: [
            { id: "claude-3", name: "Claude 3", contextLength: 200000 }
          ]
        };

        mockFetchAllModels.mockResolvedValueOnce(mockProviderModels);

        const result = await caller.models.getAvailable();

        expect(result).toEqual([
          { id: "gpt-4", name: "GPT-4", provider: "openai", contextSize: 8192, hasTools: false, recommended: false, approved: true },
          { id: "claude-3", name: "Claude 3", provider: "anthropic", contextSize: 200000, hasTools: false, recommended: false, approved: true }
        ]);
        expect(mockFetchAllModels).toHaveBeenCalled();
      });

      test("should handle errors when getting available models", async () => {
        mockFetchAllModels.mockRejectedValueOnce(new Error("Failed to get models"));

        // Should return fallback data instead of throwing
        const result = await caller.models.getAvailable();
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe("models.getEnabled", () => {
      test("should return enabled models list", async () => {
        const enabledModels = ["gpt-4", "claude-3"];
        
        mockReadGlobalConfig.mockResolvedValueOnce({
          models: { enabled: enabledModels }
        });

        const result = await caller.models.getEnabled();

        expect(result).toEqual(enabledModels);
      });

      test("should return empty array when no enabled models", async () => {
        mockReadGlobalConfig.mockResolvedValueOnce({});

        const result = await caller.models.getEnabled();

        expect(result).toEqual([]);
      });
    });

    describe("models.enable", () => {
      test("should enable a valid model", async () => {
        mockReadGlobalConfig.mockResolvedValueOnce({ models: { enabled: [] } });
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        const result = await caller.models.enable({ modelId: "gpt-4" });

        expect(result).toEqual({ success: true, modelId: "gpt-4" });
        expect(mockUpdateGlobalConfig).toHaveBeenCalledWith({
          models: { enabled: ["gpt-4"] }
        }, ".chararc");
      });

      test("should reject enabling model with invalid ID", async () => {
        await expect(
          caller.models.enable({ modelId: "" })
        ).rejects.toThrow();

        await expect(
          caller.models.enable({ modelId: "   " })
        ).rejects.toThrow();
      });

    });

    describe("models.disable", () => {
      test("should disable an enabled model", async () => {
        mockReadGlobalConfig.mockResolvedValueOnce({
          models: { enabled: ["gpt-4", "claude-3"] }
        });
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        const result = await caller.models.disable({ modelId: "gpt-4" });

        expect(result).toEqual({ success: true, modelId: "gpt-4" });
        expect(mockUpdateGlobalConfig).toHaveBeenCalledWith({
          models: { enabled: ["claude-3"] }
        }, ".chararc");
      });

      test("should handle disabling non-enabled model gracefully", async () => {
        mockReadGlobalConfig.mockResolvedValueOnce({
          models: { enabled: ["claude-3"] }
        });
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        const result = await caller.models.disable({ modelId: "gpt-4" });

        expect(result).toEqual({ success: true, modelId: "gpt-4" });
        expect(mockUpdateGlobalConfig).toHaveBeenCalledWith({
          models: { enabled: ["claude-3"] }
        }, ".chararc");
      });
    });

    describe("models.getByProvider", () => {
      test("should filter models by provider", async () => {
        const mockProviderModels = {
          openai: [
            { id: "gpt-4", name: "GPT-4", contextLength: 8192 },
            { id: "gpt-3.5", name: "GPT-3.5", contextLength: 4096 }
          ],
          anthropic: [
            { id: "claude-3", name: "Claude 3", contextLength: 200000 }
          ]
        };

        mockFetchAllModels.mockResolvedValueOnce(mockProviderModels);

        const result = await caller.models.getByProvider({ provider: "openai" });

        expect(result).toHaveLength(2);
        expect(result[0].provider).toBe("openai");
        expect(result[1].provider).toBe("openai");
      });
    });
  });

  describe("Configuration Management Endpoints", () => {
    describe("config.get", () => {
      test("should return global configuration", async () => {
        const mockConfig = { providers: {}, models: {} };
        
        mockExistsGlobalConfig.mockResolvedValueOnce(true);
        mockReadGlobalConfig.mockResolvedValueOnce(mockConfig);

        const result = await caller.config.get();

        expect(result).toEqual(mockConfig);
      });

      test("should return empty config when file doesn't exist", async () => {
        mockExistsGlobalConfig.mockResolvedValueOnce(false);

        const result = await caller.config.get();

        expect(result).toEqual({});
      });
    });

    describe("config.update", () => {
      test("should update global configuration", async () => {
        const configUpdate = { providers: {} };
        
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        const result = await caller.config.update({ config: configUpdate });

        expect(result).toEqual({ success: true });
        expect(mockUpdateGlobalConfig).toHaveBeenCalledWith(configUpdate, ".chararc");
      });

      test("should handle update errors", async () => {
        const configUpdate = { providers: {} };
        
        mockUpdateGlobalConfig.mockRejectedValueOnce(new Error("Update failed"));

        await expect(
          caller.config.update({ config: configUpdate })
        ).rejects.toThrow();
      });
    });
  });

  describe("End-to-End Workflows", () => {
    test("should complete full provider setup and model enabling workflow", async () => {
      // Step 1: Create a provider
      const providerInput: CreateProviderInput = {
        name: "My OpenAI",
        type: "openai",
        enabled: true,
        configuration: { apiKey: "sk-test123" }
      };

      mockReadGlobalConfig.mockResolvedValueOnce({});
      mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

      const provider = await caller.providers.create(providerInput);
      expect(provider.type).toBe("openai");

      // Step 2: Get available models
      const mockProviderModels = {
        openai: [
          { id: "gpt-4", name: "GPT-4", contextLength: 8192 },
          { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", contextLength: 4096 }
        ]
      };

      mockFetchAllModels.mockResolvedValueOnce(mockProviderModels);

      const availableModels = await caller.models.getAvailable();
      expect(availableModels).toHaveLength(2);

      // Step 3: Enable a model
      mockFetchAllModels.mockResolvedValueOnce(mockProviderModels);
      mockReadGlobalConfig
        .mockResolvedValueOnce({ providers: { [provider.id]: provider } })
        .mockResolvedValueOnce({ models: { enabled: [] } });
      mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

      const enableResult = await caller.models.enable({ modelId: "gpt-4" });
      expect(enableResult.success).toBe(true);

      // Step 4: Verify enabled models
      mockReadGlobalConfig.mockResolvedValueOnce({
        models: { enabled: ["gpt-4"] }
      });

      const enabledModels = await caller.models.getEnabled();
      expect(enabledModels).toContain("gpt-4");
    });

    test("should handle provider deletion with model cleanup", async () => {
      const existingProvider = {
        id: "provider1",
        name: "Test Provider",
        type: "openai" as const,
        enabled: true,
        configuration: { apiKey: "sk-test" },
        requiredFields: ["apiKey"],
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01")
      };

      // Step 1: Delete provider
      mockReadGlobalConfig.mockResolvedValueOnce({
        providers: { provider1: existingProvider },
        models: { enabled: ["gpt-4", "claude-3"] }
      });
      mockFetchAllModels.mockResolvedValueOnce({
        openai: [{ id: "gpt-4", name: "GPT-4" }],
        anthropic: [{ id: "claude-3", name: "Claude 3" }]
      });
      mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

      const deleteResult = await caller.providers.delete({ id: "provider1" });
      expect(deleteResult.success).toBe(true);

      // Verify that OpenAI models were disabled but Anthropic models remain
      expect(mockUpdateGlobalConfig).toHaveBeenCalledWith({
        providers: {},
        models: { enabled: ["claude-3"] }
      }, ".chararc");
    });

    test("should handle concurrent provider and model operations", async () => {
      // This test simulates multiple operations happening concurrently
      const provider1Input: CreateProviderInput = {
        name: "OpenAI Provider",
        type: "openai",
        enabled: true,
        configuration: { apiKey: "sk-test1" }
      };

      const provider2Input: CreateProviderInput = {
        name: "Anthropic Provider",
        type: "anthropic",
        enabled: true,
        configuration: { apiKey: "sk-ant-test2" }
      };

      // Mock responses for concurrent provider creation
      mockReadGlobalConfig
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      mockUpdateGlobalConfig
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      // Create providers concurrently
      const [provider1, provider2] = await Promise.all([
        caller.providers.create(provider1Input),
        caller.providers.create(provider2Input)
      ]);

      expect(provider1.type).toBe("openai");
      expect(provider2.type).toBe("anthropic");
      expect(mockUpdateGlobalConfig).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle malformed configuration gracefully", async () => {
      mockExistsGlobalConfig.mockResolvedValueOnce(true);
      mockReadGlobalConfig.mockResolvedValueOnce({ providers: null });

      const result = await caller.providers.list();
      expect(result).toEqual([]);
    });

    test("should handle missing models configuration", async () => {
      mockReadGlobalConfig.mockResolvedValueOnce({});

      const result = await caller.models.getEnabled();
      expect(result).toEqual([]);
    });

    test("should validate input schemas", async () => {
      // Test invalid provider type
      await expect(
        caller.providers.create({
          name: "Invalid",
          type: "invalid-type" as any,
          enabled: true,
          configuration: {}
        })
      ).rejects.toThrow();

      // Test missing required fields
      await expect(
        caller.providers.update({
          id: "", // Empty ID should fail validation
          updates: {}
        })
      ).rejects.toThrow();

      // Test invalid model ID
      await expect(
        caller.models.enable({ modelId: "" })
      ).rejects.toThrow();
    });
  });
});