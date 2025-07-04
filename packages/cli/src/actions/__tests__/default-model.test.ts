/**
 * Unit tests for default-model action
 *
 * Tests the complete functionality of the default-model action including:
 * - Server startup and shutdown
 * - API model fetching
 * - User interaction and model selection
 * - Configuration management
 * - Error handling and edge cases
 * - Action enhancer integration
 *
 * Uses Bun's native test API with mocked dependencies.
 * Run with: bun test
 */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { defaultModelAction } from "../default-model";
import type { DefaultModelActionOptions } from "../types";

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

// Mock clack prompts
const mockIntro = mock(() => {});
const mockOutro = mock(() => {});
const mockCancel = mock(() => {});
const mockConfirm = mock(() => Promise.resolve(true));
const mockSelect = mock(() => Promise.resolve("openai:::gpt-4"));
const mockSpinner = mock(() => ({
  start: mock(() => {}),
  stop: mock(() => {}),
}));
const mockIsCancel = mock(() => false);

mock.module("@clack/prompts", () => ({
  intro: mockIntro,
  outro: mockOutro,
  cancel: mockCancel,
  confirm: mockConfirm,
  select: mockSelect,
  spinner: mockSpinner,
  isCancel: mockIsCancel,
}));

// Mock settings
const mockExistsGlobalConfig = mock(() => Promise.resolve(true));
const mockReadGlobalConfig = mock(() =>
  Promise.resolve({
    env: { OPENAI_API_KEY: "test-key" },
    defaultModel: "openai:::gpt-3.5-turbo",
  }),
);
const mockUpdateGlobalConfig = mock(() => Promise.resolve());

mock.module("@chara/settings", () => ({
  existsGlobalConfig: mockExistsGlobalConfig,
  readGlobalConfig: mockReadGlobalConfig,
  updateGlobalConfig: mockUpdateGlobalConfig,
}));

// Mock server and agents
const mockServer = {
  stop: mock(() => {}),
  port: 3031,
};
const mockStartServer = mock(() => Promise.resolve(mockServer));

mock.module("@chara/agents", () => ({
  startServer: mockStartServer,
}));

// Mock fetch
const mockFetch = mock(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        models: [
          {
            id: "gpt-4",
            name: "GPT-4",
            provider: "openai",
          },
          {
            id: "gpt-3.5-turbo",
            name: "GPT-3.5 Turbo",
            provider: "openai",
          },
          {
            id: "claude-3-opus",
            name: "Claude 3 Opus",
            provider: "anthropic",
          },
        ],
      }),
  }),
);

// @ts-ignore
global.fetch = mockFetch;

describe("Default Model Action", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.setLevel.mockClear();

    mockIntro.mockClear();
    mockOutro.mockClear();
    mockCancel.mockClear();
    mockConfirm.mockClear();
    mockSelect.mockClear();
    mockSpinner.mockClear();
    mockIsCancel.mockClear();

    mockExistsGlobalConfig.mockClear();
    mockReadGlobalConfig.mockClear();
    mockUpdateGlobalConfig.mockClear();

    mockStartServer.mockClear();
    mockServer.stop.mockClear();
    mockFetch.mockClear();

    // Reset mock implementations
    mockExistsGlobalConfig.mockImplementation(() => Promise.resolve(true));
    mockReadGlobalConfig.mockImplementation(() =>
      Promise.resolve({
        env: { OPENAI_API_KEY: "test-key" },
        defaultModel: "openai:::gpt-3.5-turbo",
      }),
    );
    mockUpdateGlobalConfig.mockImplementation(() => Promise.resolve());
    mockStartServer.mockImplementation(() => Promise.resolve(mockServer));
    mockConfirm.mockImplementation(() => Promise.resolve(true));
    mockSelect.mockImplementation(() => Promise.resolve("openai:::gpt-4"));
    mockIsCancel.mockImplementation(() => false);
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            models: [
              {
                id: "gpt-4",
                name: "GPT-4",
                provider: "openai",
              },
              {
                id: "gpt-3.5-turbo",
                name: "GPT-3.5 Turbo",
                provider: "openai",
              },
            ],
          }),
      }),
    );
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
    mockCancel.mockClear();
    mockConfirm.mockClear();
    mockSelect.mockClear();
    mockSpinner.mockClear();
    mockIsCancel.mockClear();

    mockExistsGlobalConfig.mockClear();
    mockReadGlobalConfig.mockClear();
    mockUpdateGlobalConfig.mockClear();

    mockStartServer.mockClear();
    mockServer.stop.mockClear();
    mockFetch.mockClear();
  });

  describe("Basic Functionality", () => {
    test("should execute successfully with default options", async () => {
      await expect(defaultModelAction()).resolves.toBeUndefined();

      // Verify server was started
      expect(mockStartServer).toHaveBeenCalledTimes(1);
      expect(mockStartServer).toHaveBeenCalledWith({ port: 3031 });

      // Verify API was called
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3031/api/models",
      );

      // Verify user was prompted
      expect(mockSelect).toHaveBeenCalledTimes(1);
      expect(mockConfirm).toHaveBeenCalledTimes(1);

      // Verify config was updated
      expect(mockUpdateGlobalConfig).toHaveBeenCalledTimes(1);
      expect(mockUpdateGlobalConfig).toHaveBeenCalledWith({
        env: { OPENAI_API_KEY: "test-key" },
        defaultModel: "openai:::gpt-4",
      });

      // Verify server was stopped
      expect(mockServer.stop).toHaveBeenCalledTimes(1);
    });

    test("should execute successfully with custom port", async () => {
      const options: DefaultModelActionOptions = { port: 8080 };

      await expect(defaultModelAction(options)).resolves.toBeUndefined();

      expect(mockStartServer).toHaveBeenCalledWith({ port: 8080 });
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/models",
      );
    });

    test("should set verbose logging when verbose option is true", async () => {
      const options: DefaultModelActionOptions = { verbose: true };

      await expect(defaultModelAction(options)).resolves.toBeUndefined();

      expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
    });

    test("should display current default model if exists", async () => {
      await expect(defaultModelAction()).resolves.toBeUndefined();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Current default model:"),
      );
    });
  });

  describe("Configuration Management", () => {
    test("should handle missing configuration", async () => {
      mockExistsGlobalConfig.mockImplementation(() => Promise.resolve(false));

      await expect(defaultModelAction()).resolves.toBeUndefined();

      expect(mockLogger.error).toHaveBeenCalledWith(
        "No configuration found. Run 'chara init' first to set up your providers.",
      );
      expect(mockStartServer).not.toHaveBeenCalled();
    });

    test("should handle config read errors", async () => {
      mockReadGlobalConfig.mockImplementation(() =>
        Promise.reject(new Error("Config read error")),
      );

      await expect(defaultModelAction()).rejects.toThrow("Config read error");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error reading configuration:",
        expect.any(Error),
      );
    });

    test("should handle config save errors", async () => {
      mockUpdateGlobalConfig.mockImplementation(() =>
        Promise.reject(new Error("Config save error")),
      );

      await expect(defaultModelAction()).rejects.toThrow("Config save error");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error saving default model:",
        expect.any(Error),
      );
      expect(mockServer.stop).toHaveBeenCalledTimes(1);
    });

    test("should handle config without existing default model", async () => {
      mockReadGlobalConfig.mockImplementation(() =>
        Promise.resolve({
          env: { OPENAI_API_KEY: "test-key" },
          // No defaultModel property
        } as any),
      );

      await expect(defaultModelAction()).resolves.toBeUndefined();

      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining("Current default model:"),
      );
    });
  });

  describe("Server Management", () => {
    test("should handle server startup errors", async () => {
      mockStartServer.mockImplementation(() =>
        Promise.reject(new Error("Server startup error")),
      );

      await expect(defaultModelAction()).rejects.toThrow(
        "Server startup error",
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error starting server:",
        expect.any(Error),
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test("should handle server without stop method", async () => {
      const serverWithoutStop = { port: 3031 } as any;
      mockStartServer.mockImplementation(() =>
        Promise.resolve(serverWithoutStop),
      );

      await expect(defaultModelAction()).resolves.toBeUndefined();

      // Should not throw error when server doesn't have stop method
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    test("should handle server stop errors", async () => {
      mockServer.stop.mockImplementation(() => {
        throw new Error("Server stop error");
      });

      await expect(defaultModelAction()).resolves.toBeUndefined();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Error stopping server:",
        expect.any(Error),
      );
    });

    test("should close server on API fetch error", async () => {
      mockFetch.mockImplementation(() =>
        Promise.reject(new Error("API fetch error")),
      );

      await expect(defaultModelAction()).rejects.toThrow("API fetch error");

      expect(mockServer.stop).toHaveBeenCalledTimes(1);
    });

    test("should close server on user cancellation", async () => {
      mockIsCancel.mockImplementation(() => true);

      await expect(defaultModelAction()).resolves.toBeUndefined();

      expect(mockServer.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe("API Integration", () => {
    test("should handle API fetch errors", async () => {
      mockFetch.mockImplementation(() =>
        Promise.reject(new Error("Network error")),
      );

      await expect(defaultModelAction()).rejects.toThrow("Network error");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error fetching models:",
        expect.any(Error),
      );
    });

    test("should handle API HTTP errors", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        } as any),
      );

      await expect(defaultModelAction()).rejects.toThrow(
        "HTTP error! status: 500",
      );
    });

    test("should handle empty models response", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              models: [],
            }),
        }),
      );

      await expect(defaultModelAction()).resolves.toBeUndefined();

      expect(mockLogger.info).toHaveBeenCalledWith(
        "No models available. Please check your provider configuration.",
      );
      expect(mockSelect).not.toHaveBeenCalled();
      expect(mockServer.stop).toHaveBeenCalledTimes(1);
    });

    test("should handle malformed API response", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.reject(new Error("Invalid JSON")),
        }),
      );

      await expect(defaultModelAction()).rejects.toThrow("Invalid JSON");
    });
  });

  describe("User Interaction", () => {
    test("should handle user cancellation at model selection", async () => {
      // Mock select to return a cancel symbol
      const cancelSymbol = Symbol("cancel");
      mockSelect.mockImplementationOnce(() =>
        Promise.resolve(cancelSymbol as any),
      );
      mockIsCancel.mockImplementationOnce(() => true);

      await expect(defaultModelAction()).resolves.toBeUndefined();

      expect(mockCancel).toHaveBeenCalledWith("Model selection cancelled.");
      expect(mockServer.stop).toHaveBeenCalledTimes(1);
    });

    test("should handle user cancellation at confirmation", async () => {
      mockConfirm.mockImplementationOnce(() => Promise.resolve(false));

      await expect(defaultModelAction()).resolves.toBeUndefined();

      expect(mockCancel).toHaveBeenCalledWith("Default model not saved.");
      expect(mockUpdateGlobalConfig).not.toHaveBeenCalled();
      expect(mockServer.stop).toHaveBeenCalledTimes(1);
    });

    test("should handle isCancel returning true for confirmation", async () => {
      // Mock confirm to return a cancel symbol
      const cancelSymbol = Symbol("cancel");
      mockConfirm.mockImplementationOnce(() =>
        Promise.resolve(cancelSymbol as any),
      );
      mockIsCancel
        .mockImplementationOnce(() => false)
        .mockImplementationOnce(() => true);

      await expect(defaultModelAction()).resolves.toBeUndefined();

      expect(mockCancel).toHaveBeenCalledWith("Default model not saved.");
      expect(mockServer.stop).toHaveBeenCalledTimes(1);
    });

    test("should format model options correctly", async () => {
      const models = [
        { id: "gpt-4", name: "GPT-4", provider: "openai" },
        { id: "claude-3-opus", name: "Claude 3 Opus", provider: "anthropic" },
      ];

      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              models,
            }),
        }),
      );

      await expect(defaultModelAction()).resolves.toBeUndefined();

      expect(mockSelect).toHaveBeenCalledWith({
        message: "Select a default model:",
        options: [
          {
            value: "openai:::gpt-4",
            label: "GPT-4 (openai)",
            hint: "openai",
          },
          {
            value: "anthropic:::claude-3-opus",
            label: "Claude 3 Opus (anthropic)",
            hint: "anthropic",
          },
        ],
        initialValue: "openai:::gpt-3.5-turbo",
      });
    });
  });

  describe("Model Selection and Formatting", () => {
    test("should format model identifier correctly", async () => {
      mockSelect.mockImplementation(() =>
        Promise.resolve("anthropic:::claude-3-opus"),
      );

      await expect(defaultModelAction()).resolves.toBeUndefined();

      expect(mockUpdateGlobalConfig).toHaveBeenCalledWith({
        env: { OPENAI_API_KEY: "test-key" },
        defaultModel: "anthropic:::claude-3-opus",
      });
    });

    test("should preserve existing config when updating default model", async () => {
      mockReadGlobalConfig.mockImplementation(() =>
        Promise.resolve({
          env: { OPENAI_API_KEY: "test-key", ANTHROPIC_API_KEY: "another-key" },
          defaultModel: "openai:::gpt-3.5-turbo",
          otherSettings: { theme: "dark" },
        }),
      );

      await expect(defaultModelAction()).resolves.toBeUndefined();

      expect(mockUpdateGlobalConfig).toHaveBeenCalledWith({
        env: { OPENAI_API_KEY: "test-key", ANTHROPIC_API_KEY: "another-key" },
        defaultModel: "openai:::gpt-4",
        otherSettings: { theme: "dark" },
      });
    });

    test("should use current default as initial value in selection", async () => {
      const currentDefault = "anthropic:::claude-3-opus";
      mockReadGlobalConfig.mockImplementation(() =>
        Promise.resolve({
          env: { OPENAI_API_KEY: "test-key" },
          defaultModel: currentDefault,
        }),
      );

      await expect(defaultModelAction()).resolves.toBeUndefined();

      expect(mockSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          initialValue: currentDefault,
        }),
      );
    });
  });

  describe("Error Recovery", () => {
    test("should clean up server on any error", async () => {
      mockFetch.mockImplementation(() =>
        Promise.reject(new Error("Fetch error")),
      );

      await expect(defaultModelAction()).rejects.toThrow("Fetch error");

      expect(mockServer.stop).toHaveBeenCalledTimes(1);
    });

    test("should handle multiple error scenarios gracefully", async () => {
      // First call fails with server error
      mockStartServer.mockImplementationOnce(() =>
        Promise.reject(new Error("Server error")),
      );

      await expect(defaultModelAction()).rejects.toThrow("Server error");

      // Reset and try again with fetch error
      mockStartServer.mockImplementationOnce(() => Promise.resolve(mockServer));
      mockFetch.mockImplementationOnce(() =>
        Promise.reject(new Error("Fetch error")),
      );

      await expect(defaultModelAction()).rejects.toThrow("Fetch error");

      expect(mockServer.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe("Integration with Action Framework", () => {
    test("should work with action enhancers", async () => {
      // This test verifies the action works within the action framework
      const options: DefaultModelActionOptions = {
        verbose: true,
        port: 3001,
      };

      await expect(defaultModelAction(options)).resolves.toBeUndefined();

      expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
      expect(mockStartServer).toHaveBeenCalledWith({ port: 3001 });
    });

    test("should handle undefined options gracefully", async () => {
      await expect(defaultModelAction(undefined)).resolves.toBeUndefined();

      expect(mockStartServer).toHaveBeenCalledWith({ port: 3031 });
    });

    test("should handle empty options object", async () => {
      await expect(defaultModelAction({})).resolves.toBeUndefined();

      expect(mockStartServer).toHaveBeenCalledWith({ port: 3031 });
    });
  });

  describe("Performance and Resource Management", () => {
    test("should handle server startup timeout", async () => {
      mockStartServer.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 100),
          ),
      );

      await expect(defaultModelAction()).rejects.toThrow("Timeout");
    });

    test("should handle large model lists", async () => {
      const largeModelList = Array.from({ length: 100 }, (_, i) => ({
        id: `model-${i}`,
        name: `Model ${i}`,
        provider: `provider-${i % 5}`,
      }));

      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              models: largeModelList,
            }),
        }),
      );

      await expect(defaultModelAction()).resolves.toBeUndefined();

      expect(mockSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.arrayContaining([
            expect.objectContaining({
              value: expect.stringMatching(/^provider-\d+:::model-\d+$/),
            }),
          ]),
        }),
      );
    });

    test("should handle concurrent action execution", async () => {
      const promises = [
        defaultModelAction({ port: 3001 }),
        defaultModelAction({ port: 3002 }),
      ];

      // This should not cause issues with server cleanup
      await expect(Promise.all(promises)).resolves.toEqual([
        undefined,
        undefined,
      ]);
    });
  });
});
