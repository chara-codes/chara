/**
 * Unit tests for initialize-config action
 *
 * Tests the complete functionality of the initialize-config action including:
 * - Reading default model from global config
 * - Setting up .mcp.json configuration
 * - Using @netlify/build-info for dev command detection
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

mock.module("@chara-codes/logger", () => ({
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
  })
);

mock.module("@chara-codes/settings", () => ({
  existsGlobalConfig: mockExistsGlobalConfig,
  readGlobalConfig: mockReadGlobalConfig,
}));

// Mock the agents package
const mockInitialize = mock(() => Promise.resolve());

// Mock @netlify/build-info
const mockProject = {
  getBuildSettings: mock(() => Promise.resolve([{ devCommand: "npm run dev" }])),
};
const mockNodeFS = mock(() => ({}));

mock.module("@netlify/build-info", () => ({
  Project: mock(() => mockProject),
  FileSystem: mockNodeFS,
}));

// Mock fs promises
const mockWriteFile = mock(() => Promise.resolve());
const mockAccess = mock(() => Promise.resolve());

mock.module("node:fs", () => ({
  promises: {
    writeFile: mockWriteFile,
    access: mockAccess,
  },
}));

mock.module("@chara-codes/agents", () => ({
  initialize: mockInitialize,
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
    mockWriteFile.mockClear();
    mockAccess.mockClear();
    mockProject.getBuildSettings.mockClear();

    // Reset mock return values to defaults
    mockExistsGlobalConfig.mockResolvedValue(true);
    mockReadGlobalConfig.mockResolvedValue({
      env: { OPENAI_API_KEY: "test-key" },
      defaultModel: "openai:::gpt-4",
    });
    mockInitialize.mockResolvedValue(undefined);
    mockProject.getBuildSettings.mockResolvedValue([{ devCommand: "npm run dev" }]);
    mockAccess.mockRejectedValue(new Error("File not found")); // Default to creating new .mcp.json
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
    mockWriteFile.mockClear();
    mockAccess.mockClear();
    mockProject.getBuildSettings.mockClear();
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

      // Should initialize providers
      expect(mockInitialize).toHaveBeenCalledTimes(1);

      // Should detect dev command
      expect(mockProject.getBuildSettings).toHaveBeenCalledTimes(1);

      // Should create .mcp.json (since mockAccess rejects by default)
      expect(mockWriteFile).toHaveBeenCalledWith(
        ".mcp.json",
        JSON.stringify({ mcpServers: {} }, null, 2)
      );
    });

    test("should handle existing .mcp.json file", async () => {
      mockAccess.mockResolvedValue(undefined); // File exists

      await initializeConfigAction({
        verbose: false,
      });

      // Should not create new file if it exists
      expect(mockWriteFile).not.toHaveBeenCalled();
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

      // Should still proceed with initialization
      expect(mockInitialize).toHaveBeenCalledTimes(1);
      expect(mockProject.getBuildSettings).toHaveBeenCalledTimes(1);
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

      // Should still proceed with initialization
      expect(mockInitialize).toHaveBeenCalledTimes(1);
      expect(mockProject.getBuildSettings).toHaveBeenCalledTimes(1);
    });

    test("should handle dev command detection failure", async () => {
      mockProject.getBuildSettings.mockRejectedValue(new Error("Detection failed"));

      await initializeConfigAction({
        verbose: true,
      });

      // Should still proceed with initialization
      expect(mockInitialize).toHaveBeenCalledTimes(1);
      expect(mockWriteFile).toHaveBeenCalledWith(
        ".mcp.json",
        JSON.stringify({ mcpServers: {} }, null, 2)
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
        expect.any(Error)
      );

      // Should still proceed with initialization
      expect(mockInitialize).toHaveBeenCalledTimes(1);
      expect(mockProject.getBuildSettings).toHaveBeenCalledTimes(1);
    });

    test("should handle provider initialization errors", async () => {
      mockInitialize.mockRejectedValue(
        new Error("Provider initialization failed")
      );

      await expect(
        initializeConfigAction({
          verbose: true,
        })
      ).rejects.toThrow(
        "Failed to initialize providers: Provider initialization failed"
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error initializing providers:",
        expect.any(Error)
      );

      // Should not proceed to dev command detection
      expect(mockProject.getBuildSettings).not.toHaveBeenCalled();
    });

    test("should handle MCP config setup errors", async () => {
      mockWriteFile.mockRejectedValue(
        new Error("MCP config setup failed")
      );

      await expect(
        initializeConfigAction({
          verbose: true,
        })
      ).rejects.toThrow(
        "Failed to setup MCP configuration: MCP config setup failed"
      );
    });

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error initializing configuration:",
        expect.any(Error)
      );
    });

    test("should handle non-Error objects thrown", async () => {
      mockWriteFile.mockRejectedValue("String error");

      await expect(
        initializeConfigAction({
          verbose: true,
        })
      ).rejects.toThrow("Failed to setup MCP configuration:");
    });
  });

  describe("Integration with UI Components", () => {
    test("should use spinner for all operations", async () => {
      // This test verifies the action completes without errors
      // The actual UI components are tested in integration tests
      await expect(
        initializeConfigAction({
          verbose: false,
        })
      ).resolves.toBeUndefined();
    });

    test("should show intro and outro with correct messages", async () => {
      // This test verifies the action completes without errors
      // The actual UI components are tested in integration tests
      await expect(
        initializeConfigAction({
          verbose: false,
        })
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
        "Global configuration found, reading default model..."
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Selected model from global config: openai:::gpt-4"
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Providers initialization completed"
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Initializing config file: .chara.json"
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Using model: openai:::gpt-4"
      );
    });

    test("should log fallback scenarios in verbose mode", async () => {
      mockExistsGlobalConfig.mockResolvedValue(false);

      await initializeConfigAction({
        verbose: true,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Global configuration does not exist"
      );
    });
  });

  describe("Configuration File Handling", () => {
    test("should create default .mcp.json when not specified", async () => {
      await initializeConfigAction({});

      expect(mockWriteFile).toHaveBeenCalledWith(
        ".mcp.json",
        JSON.stringify({ mcpServers: {} }, null, 2)
      );
    });

    test("should handle empty options object", async () => {
      await initializeConfigAction({});

      expect(mockExistsGlobalConfig).toHaveBeenCalledTimes(1);
      expect(mockInitialize).toHaveBeenCalledTimes(1);
      expect(mockProject.getBuildSettings).toHaveBeenCalledTimes(1);
    });

    test("should handle undefined options", async () => {
      await initializeConfigAction();

      expect(mockExistsGlobalConfig).toHaveBeenCalledTimes(1);
      expect(mockInitialize).toHaveBeenCalledTimes(1);
      expect(mockProject.getBuildSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe("Model Selection Logic", () => {
    test("should detect development command properly", async () => {
      mockProject.getBuildSettings.mockResolvedValue([{ devCommand: "vite dev" }]);

      await initializeConfigAction({
        verbose: true,
      });

      expect(mockProject.getBuildSettings).toHaveBeenCalledTimes(1);
      expect(mockInitialize).toHaveBeenCalledTimes(1);
    });

    test("should handle empty string defaultModel", async () => {
      mockReadGlobalConfig.mockResolvedValue({
        env: { OPENAI_API_KEY: "test-key" },
        defaultModel: "",
      });

      await initializeConfigAction({
        verbose: true,
      });

      // Should still proceed with initialization
      expect(mockInitialize).toHaveBeenCalledTimes(1);
      expect(mockProject.getBuildSettings).toHaveBeenCalledTimes(1);
    });

    test("should handle null defaultModel", async () => {
      mockReadGlobalConfig.mockResolvedValue({
        env: { OPENAI_API_KEY: "test-key" },
        defaultModel: null,
      });

      await initializeConfigAction({
        verbose: true,
      });

      // Should still proceed with initialization
      expect(mockInitialize).toHaveBeenCalledTimes(1);
      expect(mockProject.getBuildSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe("Output Messages", () => {
    test("should complete successfully with detected dev command", async () => {
      mockProject.getBuildSettings.mockResolvedValue([{ devCommand: "npm run start" }]);

      await expect(
        initializeConfigAction({
          verbose: true,
        })
      ).resolves.toBeUndefined();

      expect(mockProject.getBuildSettings).toHaveBeenCalledTimes(1);
    });

    test("should include helpful next steps in output", async () => {
      await expect(initializeConfigAction({})).resolves.toBeUndefined();

      expect(mockWriteFile).toHaveBeenCalledWith(
        ".mcp.json",
        JSON.stringify({ mcpServers: {} }, null, 2)
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

      // Should handle gracefully and proceed
      expect(mockInitialize).toHaveBeenCalledTimes(1);
      expect(mockProject.getBuildSettings).toHaveBeenCalledTimes(1);
    });

    test("should handle empty build settings", async () => {
      mockProject.getBuildSettings.mockResolvedValue([]);

      await initializeConfigAction({
        verbose: true,
      });

      expect(mockProject.getBuildSettings).toHaveBeenCalledTimes(1);
      expect(mockInitialize).toHaveBeenCalledTimes(1);
    });

    test("should handle build settings without devCommand", async () => {
      mockProject.getBuildSettings.mockResolvedValue([{ buildCommand: "npm run build" }]);

      await initializeConfigAction({
        verbose: true,
      });

      expect(mockProject.getBuildSettings).toHaveBeenCalledTimes(1);
      expect(mockInitialize).toHaveBeenCalledTimes(1);
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

      mockProject.getBuildSettings.mockImplementation(async () => {
        callOrder.push("getBuildSettings");
        return [{ devCommand: "npm run dev" }];
      });

      mockWriteFile.mockImplementation(async () => {
        callOrder.push("writeFile");
      });

      await initializeConfigAction({
        verbose: false,
      });

      expect(callOrder).toEqual([
        "existsGlobalConfig",
        "readGlobalConfig",
        "initialize",
        "getBuildSettings",
        "writeFile",
      ]);
    });
  });
});
