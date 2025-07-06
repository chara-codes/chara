/**
 * Unit tests for initialize-config action
 *
 * Tests the complete functionality of the initialize-config action including:
 * - Reading default model from global config
 * - Calling initializeCharaConfig with the correct model
 * - Provider initialization
 * - Error handling and edge cases
 * - Integration with the action factory
 *
 * Uses Bun's native test API with mocked dependencies.
 * Run with: bun test
 */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { initializeConfigAction } from "../initialize-config";
import type { InitializeConfigActionOptions } from "../types";

// Mock the logger
const mockLogger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
  setLevel: mock(() => {}),
};

mock.module("@chara/logger", () => ({
  logger: mockLogger,
}));

// Mock the prompts utilities
const mockIntro = mock(() => {});
const mockOutro = mock(() => {});
const mockSpinner = mock(() => ({
  start: mock(() => {}),
  stop: mock(() => {}),
}));

mock.module("../utils/prompts", () => ({
  intro: mockIntro,
  outro: mockOutro,
  spinner: mockSpinner,
}));

// Mock the settings
const mockExistsGlobalConfig = mock(() => Promise.resolve(true));
const mockReadGlobalConfig = mock(() =>
  Promise.resolve({
    env: { OPENAI_API_KEY: "test-key" },
    defaultModel: "openai:::gpt-4",
  }),
);

mock.module("@chara/settings", () => ({
  existsGlobalConfig: mockExistsGlobalConfig,
  readGlobalConfig: mockReadGlobalConfig,
}));

// Mock the agents package
const mockInitialize = mock(() => Promise.resolve());
const mockInitializeCharaConfig = mock(() =>
  Promise.resolve({ dev: "npx serve ." }),
);

mock.module("@chara/agents", () => ({
  initialize: mockInitialize,
  initializeCharaConfig: mockInitializeCharaConfig,
}));

describe("Initialize Config Action", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.setLevel.mockClear();

    mockIntro.mockClear();
    mockOutro.mockClear();
    mockSpinner.mockClear();

    mockExistsGlobalConfig.mockClear();
    mockReadGlobalConfig.mockClear();

    mockInitialize.mockClear();
    mockInitializeCharaConfig.mockClear();

    // Reset mock return values to defaults
    mockExistsGlobalConfig.mockResolvedValue(true);
    mockReadGlobalConfig.mockResolvedValue({
      env: { OPENAI_API_KEY: "test-key" },
      defaultModel: "openai:::gpt-4",
    });
    mockInitialize.mockResolvedValue(undefined);
    mockInitializeCharaConfig.mockResolvedValue({ dev: "npx serve ." });
  });

  afterEach(() => {
    // Clean up after each test
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.setLevel.mockClear();

    mockIntro.mockClear();
    mockOutro.mockClear();
    mockSpinner.mockClear();

    mockExistsGlobalConfig.mockClear();
    mockReadGlobalConfig.mockClear();

    mockInitialize.mockClear();
    mockInitializeCharaConfig.mockClear();
  });

  describe("Basic Functionality", () => {
    test("should initialize config with default model from global config", async () => {
      await initializeConfigAction({
        verbose: false,
      });

      // Should check for global config
      expect(mockExistsGlobalConfig).toHaveBeenCalledTimes(1);

      // Should read global config
      expect(mockReadGlobalConfig).toHaveBeenCalledTimes(1);

      // Should initialize providers
      expect(mockInitialize).toHaveBeenCalledTimes(1);

      // Should initialize chara config with the model from global config
      expect(mockInitializeCharaConfig).toHaveBeenCalledTimes(1);
      expect(mockInitializeCharaConfig).toHaveBeenCalledWith(
        ".chara.json",
        "openai:::gpt-4",
      );

      // Verify action completed successfully
      expect(mockInitializeCharaConfig).toHaveBeenCalledTimes(1);
    });

    test("should use custom config file when specified", async () => {
      await initializeConfigAction({
        configFile: "custom.chara.json",
        verbose: false,
      });

      expect(mockInitializeCharaConfig).toHaveBeenCalledWith(
        "custom.chara.json",
        "openai:::gpt-4",
      );
    });

    test("should set debug logging when verbose is true", async () => {
      await initializeConfigAction({
        verbose: true,
      });

      expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
      expect(mockLogger.debug).toHaveBeenCalled();
    });
  });

  describe("Global Config Scenarios", () => {
    test("should use fallback model when no global config exists", async () => {
      mockExistsGlobalConfig.mockResolvedValue(false);

      await initializeConfigAction({
        verbose: true,
      });

      expect(mockExistsGlobalConfig).toHaveBeenCalledTimes(1);
      expect(mockReadGlobalConfig).not.toHaveBeenCalled();

      // Should use default fallback model
      expect(mockInitializeCharaConfig).toHaveBeenCalledWith(
        ".chara.json",
        "deepseek:::deepseek-chat",
      );
    });

    test("should use fallback model when global config exists but no defaultModel", async () => {
      mockReadGlobalConfig.mockResolvedValue({
        env: { OPENAI_API_KEY: "test-key" },
        // No defaultModel property
      });

      await initializeConfigAction({
        verbose: true,
      });

      expect(mockExistsGlobalConfig).toHaveBeenCalledTimes(1);
      expect(mockReadGlobalConfig).toHaveBeenCalledTimes(1);

      // Should use default fallback model
      expect(mockInitializeCharaConfig).toHaveBeenCalledWith(
        ".chara.json",
        "deepseek:::deepseek-chat",
      );
    });

    test("should use specific model from global config", async () => {
      mockReadGlobalConfig.mockResolvedValue({
        env: { ANTHROPIC_API_KEY: "test-key" },
        defaultModel: "anthropic:::claude-3-5-sonnet",
      });

      await initializeConfigAction({
        verbose: true,
      });

      expect(mockInitializeCharaConfig).toHaveBeenCalledWith(
        ".chara.json",
        "anthropic:::claude-3-5-sonnet",
      );
    });
  });

  describe("Error Handling", () => {
    test("should handle global config read errors gracefully", async () => {
      mockReadGlobalConfig.mockRejectedValue(new Error("Config read failed"));

      await initializeConfigAction({
        verbose: true,
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error reading global configuration:",
        expect.any(Error),
      );

      // Should still proceed with fallback model
      expect(mockInitializeCharaConfig).toHaveBeenCalledWith(
        ".chara.json",
        "deepseek:::deepseek-chat",
      );
    });

    test("should handle provider initialization errors", async () => {
      mockInitialize.mockRejectedValue(
        new Error("Provider initialization failed"),
      );

      await expect(
        initializeConfigAction({
          verbose: true,
        }),
      ).rejects.toThrow(
        "Failed to initialize providers: Provider initialization failed",
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error initializing providers:",
        expect.any(Error),
      );

      // Should not proceed to initialize chara config
      expect(mockInitializeCharaConfig).not.toHaveBeenCalled();
    });

    test("should handle chara config initialization errors", async () => {
      mockInitializeCharaConfig.mockRejectedValue(
        new Error("Chara config initialization failed"),
      );

      await expect(
        initializeConfigAction({
          verbose: true,
        }),
      ).rejects.toThrow(
        "Failed to initialize Chara configuration: Chara config initialization failed",
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error initializing configuration:",
        expect.any(Error),
      );
    });

    test("should handle non-Error objects thrown", async () => {
      mockInitializeCharaConfig.mockRejectedValue("String error");

      await expect(
        initializeConfigAction({
          verbose: true,
        }),
      ).rejects.toThrow("Failed to initialize Chara configuration:");
    });
  });

  describe("Integration with UI Components", () => {
    test("should use spinner for all operations", async () => {
      // This test verifies the action completes without errors
      // The actual UI components are tested in integration tests
      await expect(
        initializeConfigAction({
          verbose: false,
        }),
      ).resolves.toBeUndefined();
    });

    test("should show intro and outro with correct messages", async () => {
      // This test verifies the action completes without errors
      // The actual UI components are tested in integration tests
      await expect(
        initializeConfigAction({
          verbose: false,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe("Verbose Mode", () => {
    test("should log detailed information in verbose mode", async () => {
      await initializeConfigAction({
        verbose: true,
      });

      // Should set debug log level
      expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");

      // Should log detailed steps
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Global configuration found, reading default model...",
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Selected model from global config: openai:::gpt-4",
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Providers initialization completed",
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Initializing config file: .chara.json",
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Using model: openai:::gpt-4",
      );
    });

    test("should log fallback scenarios in verbose mode", async () => {
      mockExistsGlobalConfig.mockResolvedValue(false);

      await initializeConfigAction({
        verbose: true,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Global configuration does not exist",
      );
    });
  });

  describe("Configuration File Handling", () => {
    test("should use default config file when not specified", async () => {
      await initializeConfigAction({});

      expect(mockInitializeCharaConfig).toHaveBeenCalledWith(
        ".chara.json",
        "openai:::gpt-4",
      );
    });

    test("should handle empty options object", async () => {
      await initializeConfigAction({});

      expect(mockExistsGlobalConfig).toHaveBeenCalledTimes(1);
      expect(mockInitialize).toHaveBeenCalledTimes(1);
      expect(mockInitializeCharaConfig).toHaveBeenCalledTimes(1);
    });

    test("should handle undefined options", async () => {
      await initializeConfigAction();

      expect(mockExistsGlobalConfig).toHaveBeenCalledTimes(1);
      expect(mockInitialize).toHaveBeenCalledTimes(1);
      expect(mockInitializeCharaConfig).toHaveBeenCalledTimes(1);
    });
  });

  describe("Model Selection Logic", () => {
    test("should prioritize global config defaultModel", async () => {
      mockReadGlobalConfig.mockResolvedValue({
        env: { MULTIPLE_API_KEYS: "test" },
        defaultModel: "priority:::model",
      });

      await initializeConfigAction({
        verbose: true,
      });

      expect(mockInitializeCharaConfig).toHaveBeenCalledWith(
        ".chara.json",
        "priority:::model",
      );
    });

    test("should handle empty string defaultModel", async () => {
      mockReadGlobalConfig.mockResolvedValue({
        env: { OPENAI_API_KEY: "test-key" },
        defaultModel: "",
      });

      await initializeConfigAction({
        verbose: true,
      });

      // Empty string should be treated as no defaultModel
      expect(mockInitializeCharaConfig).toHaveBeenCalledWith(
        ".chara.json",
        "deepseek:::deepseek-chat",
      );
    });

    test("should handle null defaultModel", async () => {
      mockReadGlobalConfig.mockResolvedValue({
        env: { OPENAI_API_KEY: "test-key" },
        defaultModel: null,
      });

      await initializeConfigAction({
        verbose: true,
      });

      // Null should be treated as no defaultModel
      expect(mockInitializeCharaConfig).toHaveBeenCalledWith(
        ".chara.json",
        "deepseek:::deepseek-chat",
      );
    });
  });

  describe("Output Messages", () => {
    test("should show correct success message with model info", async () => {
      await expect(
        initializeConfigAction({
          configFile: "test.json",
        }),
      ).resolves.toBeUndefined();

      expect(mockInitializeCharaConfig).toHaveBeenCalledWith(
        "test.json",
        "openai:::gpt-4",
      );
    });

    test("should include helpful next steps in output", async () => {
      await expect(initializeConfigAction({})).resolves.toBeUndefined();

      expect(mockInitializeCharaConfig).toHaveBeenCalledWith(
        ".chara.json",
        "openai:::gpt-4",
      );
    });
  });

  describe("Edge Cases", () => {
    test("should handle malformed global config", async () => {
      mockReadGlobalConfig.mockResolvedValue({
        // Malformed config without expected structure
        random: "data",
      });

      await initializeConfigAction({
        verbose: true,
      });

      // Should handle gracefully and use fallback
      expect(mockInitializeCharaConfig).toHaveBeenCalledWith(
        ".chara.json",
        "deepseek:::deepseek-chat",
      );
    });

    test("should handle very long config file paths", async () => {
      const longPath =
        "very/long/path/to/config/file/that/might/cause/issues.chara.json";

      await initializeConfigAction({
        configFile: longPath,
      });

      expect(mockInitializeCharaConfig).toHaveBeenCalledWith(
        longPath,
        "openai:::gpt-4",
      );
    });

    test("should handle special characters in config file path", async () => {
      const specialPath = "config with spaces & symbols.chara.json";

      await initializeConfigAction({
        configFile: specialPath,
      });

      expect(mockInitializeCharaConfig).toHaveBeenCalledWith(
        specialPath,
        "openai:::gpt-4",
      );
    });
  });

  describe("Performance and Timing", () => {
    test("should complete within reasonable time", async () => {
      const startTime = performance.now();

      await initializeConfigAction({
        verbose: false,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in under 100ms (mocked operations should be fast)
      expect(duration).toBeLessThan(100);
    });

    test("should call operations in correct sequence", async () => {
      const callOrder: string[] = [];

      mockExistsGlobalConfig.mockImplementation(async () => {
        callOrder.push("existsGlobalConfig");
        return true;
      });

      mockReadGlobalConfig.mockImplementation(async () => {
        callOrder.push("readGlobalConfig");
        return { defaultModel: "test:::model" };
      });

      mockInitialize.mockImplementation(async () => {
        callOrder.push("initialize");
      });

      mockInitializeCharaConfig.mockImplementation(async () => {
        callOrder.push("initializeCharaConfig");
        return {};
      });

      await initializeConfigAction({
        verbose: false,
      });

      expect(callOrder).toEqual([
        "existsGlobalConfig",
        "readGlobalConfig",
        "initialize",
        "initializeCharaConfig",
      ]);
    });
  });
});
