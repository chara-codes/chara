import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { SettingsService } from "../settingsService";
import { SettingsErrorType, type CreateProviderInput } from "../../types/settings";
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

describe("SettingsService", () => {
  let settingsService: SettingsService;

  beforeEach(() => {
    settingsService = new SettingsService("test-config");
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

  describe("Provider Management", () => {
    describe("getProviders", () => {
      test("should return empty array when no config exists", async () => {
        mockExistsGlobalConfig.mockResolvedValueOnce(false);
        
        const providers = await settingsService.getProviders();
        
        expect(providers).toEqual([]);
        expect(mockExistsGlobalConfig).toHaveBeenCalledWith("test-config");
      });

      test("should return providers from global config", async () => {
        const mockProviders = {
          "provider1": {
            id: "provider1",
            name: "Test Provider",
            type: "openai",
            enabled: true,
            configuration: { apiKey: "test-key" },
            requiredFields: ["apiKey"],
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01")
          }
        };
        
        mockExistsGlobalConfig.mockResolvedValueOnce(true);
        mockReadGlobalConfig.mockResolvedValueOnce({ providers: mockProviders });
        
        const providers = await settingsService.getProviders();
        
        expect(providers).toEqual([mockProviders.provider1]);
        expect(mockReadGlobalConfig).toHaveBeenCalledWith("test-config");
      });

      test("should handle missing providers in config", async () => {
        mockExistsGlobalConfig.mockResolvedValueOnce(true);
        mockReadGlobalConfig.mockResolvedValueOnce({});
        
        const providers = await settingsService.getProviders();
        
        expect(providers).toEqual([]);
      });

      test("should throw error when reading config fails", async () => {
        mockExistsGlobalConfig.mockResolvedValueOnce(true);
        mockReadGlobalConfig.mockRejectedValueOnce(new Error("Read failed"));
        
        await expect(settingsService.getProviders()).rejects.toThrow();
      });
    });

    describe("createProvider", () => {
      test("should create a valid OpenAI provider", async () => {
        const providerInput: CreateProviderInput = {
          name: "My OpenAI",
          type: "openai",
          enabled: true,
          configuration: { apiKey: "sk-test123" }
        };

        mockReadGlobalConfig.mockResolvedValueOnce({});
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        const result = await settingsService.createProvider(providerInput);

        expect(result.name).toBe("My OpenAI");
        expect(result.type).toBe("openai");
        expect(result.enabled).toBe(true);
        expect(result.configuration.apiKey).toBe("sk-test123");
        expect(result.requiredFields).toEqual(["apiKey"]);
        expect(result.id).toMatch(/^openai_\d+_/);
        expect(mockUpdateGlobalConfig).toHaveBeenCalled();
      });

      test("should auto-generate name from provider type when name not provided", async () => {
        const providerInput: CreateProviderInput = {
          type: "openai",
          enabled: true,
          configuration: { apiKey: "sk-test123" }
        };

        mockReadGlobalConfig.mockResolvedValueOnce({});
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        const result = await settingsService.createProvider(providerInput);

        expect(result.name).toBe("OpenAI");
        expect(result.type).toBe("openai");
        expect(result.enabled).toBe(true);
        expect(result.configuration.apiKey).toBe("sk-test123");
        expect(result.requiredFields).toEqual(["apiKey"]);
        expect(result.id).toMatch(/^openai_\d+_/);
        expect(mockUpdateGlobalConfig).toHaveBeenCalled();
      });

      test("should create a valid Anthropic provider", async () => {
        const providerInput: CreateProviderInput = {
          name: "My Anthropic",
          type: "anthropic",
          enabled: true,
          configuration: { apiKey: "sk-ant-test123" }
        };

        mockReadGlobalConfig.mockResolvedValueOnce({});
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        const result = await settingsService.createProvider(providerInput);

        expect(result.name).toBe("My Anthropic");
        expect(result.type).toBe("anthropic");
        expect(result.configuration.apiKey).toBe("sk-ant-test123");
        expect(result.requiredFields).toEqual(["apiKey"]);
      });

      test("should create a DIAL provider with baseUrl", async () => {
        const providerInput: CreateProviderInput = {
          name: "My DIAL",
          type: "dial",
          enabled: true,
          configuration: { 
            apiKey: "bearer-token", 
            baseUrl: "https://dial.example.com" 
          }
        };

        mockReadGlobalConfig.mockResolvedValueOnce({});
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        const result = await settingsService.createProvider(providerInput);

        expect(result.name).toBe("My DIAL");
        expect(result.type).toBe("dial");
        expect(result.configuration.baseUrl).toBe("https://dial.example.com");
        expect(result.requiredFields).toEqual(["apiKey", "baseUrl"]);
      });

      test("should reject unsupported provider type", async () => {
        const providerInput = {
          name: "Invalid Provider",
          type: "invalid-type" as any,
          enabled: true,
          configuration: {}
        };

        await expect(settingsService.createProvider(providerInput)).rejects.toMatchObject({
          type: SettingsErrorType.SETTINGS_SAVE_ERROR,
          message: "Failed to create provider",
          details: expect.objectContaining({
            type: SettingsErrorType.VALIDATION_ERROR,
            message: "Unsupported provider type: invalid-type"
          })
        });
      });

      test("should reject OpenAI provider with missing API key", async () => {
        const providerInput: CreateProviderInput = {
          name: "Invalid OpenAI",
          type: "openai",
          enabled: true,
          configuration: {}
        };

        await expect(settingsService.createProvider(providerInput)).rejects.toMatchObject({
          type: SettingsErrorType.SETTINGS_SAVE_ERROR,
          message: "Failed to create provider",
          details: expect.objectContaining({
            type: SettingsErrorType.VALIDATION_ERROR,
            message: "Provider configuration validation failed"
          })
        });
      });

      test("should reject OpenAI provider with invalid API key format", async () => {
        const providerInput: CreateProviderInput = {
          name: "Invalid OpenAI",
          type: "openai",
          enabled: true,
          configuration: { apiKey: "invalid-key" }
        };

        await expect(settingsService.createProvider(providerInput)).rejects.toMatchObject({
          type: SettingsErrorType.SETTINGS_SAVE_ERROR,
          message: "Failed to create provider",
          details: expect.objectContaining({
            type: SettingsErrorType.VALIDATION_ERROR,
            message: "Provider configuration validation failed"
          })
        });
      });

      test("should reject Anthropic provider with invalid API key format", async () => {
        const providerInput: CreateProviderInput = {
          name: "Invalid Anthropic",
          type: "anthropic",
          enabled: true,
          configuration: { apiKey: "sk-invalid" }
        };

        await expect(settingsService.createProvider(providerInput)).rejects.toMatchObject({
          type: SettingsErrorType.SETTINGS_SAVE_ERROR,
          message: "Failed to create provider",
          details: expect.objectContaining({
            type: SettingsErrorType.VALIDATION_ERROR,
            message: "Provider configuration validation failed"
          })
        });
      });

      test("should reject DIAL provider with invalid URL", async () => {
        const providerInput: CreateProviderInput = {
          name: "Invalid DIAL",
          type: "dial",
          enabled: true,
          configuration: { 
            apiKey: "bearer-token", 
            baseUrl: "not-a-url" 
          }
        };

        await expect(settingsService.createProvider(providerInput)).rejects.toMatchObject({
          type: SettingsErrorType.SETTINGS_SAVE_ERROR,
          message: "Failed to create provider",
          details: expect.objectContaining({
            type: SettingsErrorType.VALIDATION_ERROR,
            message: "Provider configuration validation failed"
          })
        });
      });
    });

    describe("updateProvider", () => {
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

        const updates = {
          name: "New Name",
          configuration: { apiKey: "sk-new123" }
        };

        const result = await settingsService.updateProvider("provider1", updates);

        expect(result.name).toBe("New Name");
        expect(result.configuration.apiKey).toBe("sk-new123");
        expect(result.id).toBe("provider1");
        expect(result.updatedAt).toBeInstanceOf(Date);
        expect(mockUpdateGlobalConfig).toHaveBeenCalled();
      });

      test("should reject update for non-existent provider", async () => {
        mockReadGlobalConfig.mockResolvedValueOnce({ providers: {} });

        await expect(
          settingsService.updateProvider("nonexistent", { name: "New Name" })
        ).rejects.toMatchObject({
          type: SettingsErrorType.SETTINGS_SAVE_ERROR,
          message: "Failed to update provider",
          details: expect.objectContaining({
            type: SettingsErrorType.VALIDATION_ERROR,
            message: "Provider with id nonexistent not found"
          })
        });
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

        const updates = {
          configuration: { apiKey: "invalid-key" }
        };

        await expect(
          settingsService.updateProvider("provider1", updates)
        ).rejects.toMatchObject({
          type: SettingsErrorType.SETTINGS_SAVE_ERROR,
          message: "Failed to update provider",
          details: expect.objectContaining({
            type: SettingsErrorType.VALIDATION_ERROR,
            message: "Provider configuration validation failed"
          })
        });
      });
    });

    describe("deleteProvider", () => {
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

        await settingsService.deleteProvider("provider1");

        expect(mockUpdateGlobalConfig).toHaveBeenCalledWith({
          providers: {},
          models: { enabled: ["model2"] }
        }, "test-config");
      });

      test("should reject deletion of non-existent provider", async () => {
        mockReadGlobalConfig.mockResolvedValueOnce({ providers: {} });

        await expect(
          settingsService.deleteProvider("nonexistent")
        ).rejects.toMatchObject({
          type: SettingsErrorType.SETTINGS_SAVE_ERROR,
          message: "Failed to delete provider",
          details: expect.objectContaining({
            type: SettingsErrorType.VALIDATION_ERROR,
            message: "Provider with id nonexistent not found"
          })
        });
      });
    });

    describe("getProvidersByType", () => {
      test("should filter providers by type", async () => {
        const providers = [
          {
            id: "provider1",
            name: "OpenAI 1",
            type: "openai" as const,
            enabled: true,
            configuration: {},
            requiredFields: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: "provider2",
            name: "Anthropic 1",
            type: "anthropic" as const,
            enabled: true,
            configuration: {},
            requiredFields: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: "provider3",
            name: "OpenAI 2",
            type: "openai" as const,
            enabled: false,
            configuration: {},
            requiredFields: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        mockExistsGlobalConfig.mockResolvedValueOnce(true);
        mockReadGlobalConfig.mockResolvedValueOnce({
          providers: {
            provider1: providers[0],
            provider2: providers[1],
            provider3: providers[2]
          }
        });

        const openaiProviders = await settingsService.getProvidersByType("openai");

        expect(openaiProviders).toHaveLength(2);
        expect(openaiProviders[0].type).toBe("openai");
        expect(openaiProviders[1].type).toBe("openai");
      });
    });
  });

  describe("Model Management", () => {
    describe("getAvailableModels", () => {
      test("should return models from providers", async () => {
        const mockProviderModels = {
          openai: [
            { id: "gpt-4", name: "GPT-4", contextLength: 8192 }
          ],
          anthropic: [
            { id: "claude-3", name: "Claude 3", contextLength: 200000 }
          ]
        };

        mockFetchAllModels.mockResolvedValueOnce(mockProviderModels);

        const models = await settingsService.getAvailableModels();

        expect(models).toEqual([
          { id: "gpt-4", name: "GPT-4", provider: "openai", contextSize: 8192, hasTools: false, recommended: false, approved: true },
          { id: "claude-3", name: "Claude 3", provider: "anthropic", contextSize: 200000, hasTools: false, recommended: false, approved: true }
        ]);
        expect(mockFetchAllModels).toHaveBeenCalled();
      });
    });

    describe("getEnabledModels", () => {
      test("should return enabled models list", async () => {
        const enabledModels = ["gpt-4", "claude-3"];
        
        mockReadGlobalConfig.mockResolvedValueOnce({
          models: { enabled: enabledModels }
        });

        const result = await settingsService.getEnabledModels();

        expect(result).toEqual(enabledModels);
      });

      test("should return empty array when no enabled models", async () => {
        mockReadGlobalConfig.mockResolvedValueOnce({});

        const result = await settingsService.getEnabledModels();

        expect(result).toEqual([]);
      });
    });

    describe("enableModel", () => {
      test("should enable a valid model", async () => {
        mockReadGlobalConfig.mockResolvedValueOnce({ models: { enabled: [] } });
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        await settingsService.enableModel("gpt-4");

        expect(mockUpdateGlobalConfig).toHaveBeenCalledWith({
          models: { enabled: ["gpt-4"] }
        }, "test-config");
      });

      test("should reject enabling model with invalid ID", async () => {
        await expect(
          settingsService.enableModel("")
        ).rejects.toMatchObject({
          type: SettingsErrorType.VALIDATION_ERROR,
          message: "Model ID is required and must be a non-empty string"
        });

        await expect(
          settingsService.enableModel("   ")
        ).rejects.toMatchObject({
          type: SettingsErrorType.VALIDATION_ERROR,
          message: "Model ID is required and must be a non-empty string"
        });
      });

      test("should not duplicate already enabled model", async () => {
        mockReadGlobalConfig.mockResolvedValueOnce({ models: { enabled: ["gpt-4"] } });
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        await settingsService.enableModel("gpt-4");

        // Should not call update since model is already enabled
        expect(mockUpdateGlobalConfig).not.toHaveBeenCalled();
      });
    });

    describe("disableModel", () => {
      test("should disable an enabled model", async () => {
        mockReadGlobalConfig.mockResolvedValueOnce({
          models: { enabled: ["gpt-4", "claude-3"] }
        });
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        await settingsService.disableModel("gpt-4");

        expect(mockUpdateGlobalConfig).toHaveBeenCalledWith({
          models: { enabled: ["claude-3"] }
        }, "test-config");
      });

      test("should handle disabling non-enabled model gracefully", async () => {
        mockReadGlobalConfig.mockResolvedValueOnce({
          models: { enabled: ["claude-3"] }
        });
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        await settingsService.disableModel("gpt-4");

        expect(mockUpdateGlobalConfig).toHaveBeenCalledWith({
          models: { enabled: ["claude-3"] }
        }, "test-config");
      });
    });

    describe("getModelsByProvider", () => {
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

        const openaiModels = await settingsService.getModelsByProvider("openai");

        expect(openaiModels).toHaveLength(2);
        expect(openaiModels[0].provider).toBe("openai");
        expect(openaiModels[1].provider).toBe("openai");
      });
    });


  });

  describe("Configuration Management", () => {
    describe("getGlobalConfig", () => {
      test("should return global config when exists", async () => {
        const mockConfig = { providers: {}, models: {} };
        
        mockExistsGlobalConfig.mockResolvedValueOnce(true);
        mockReadGlobalConfig.mockResolvedValueOnce(mockConfig);

        const config = await settingsService.getGlobalConfig();

        expect(config).toEqual(mockConfig);
      });

      test("should return empty config when file doesn't exist", async () => {
        mockExistsGlobalConfig.mockResolvedValueOnce(false);

        const config = await settingsService.getGlobalConfig();

        expect(config).toEqual({});
      });
    });

    describe("updateGlobalConfig", () => {
      test("should update global config", async () => {
        const configUpdate = { providers: {} };
        
        mockUpdateGlobalConfig.mockResolvedValueOnce(undefined);

        await settingsService.updateGlobalConfig(configUpdate);

        expect(mockUpdateGlobalConfig).toHaveBeenCalledWith(configUpdate, "test-config");
      });
    });
  });
});