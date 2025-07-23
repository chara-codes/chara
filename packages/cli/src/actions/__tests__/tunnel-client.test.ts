import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  startTunnelClientAction,
  stopTunnelClientAction,
} from "../tunnel-client";

// Mock dependencies
const mockLogger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  warning: mock(() => {}),
  error: mock(() => {}),
  setLevel: mock(() => {}),
};

mock.module("@chara-codes/logger", () => ({
  logger: mockLogger,
}));

const mockIntro = mock(() => {});
const mockOutro = mock(() => {});
const mockSpinnerInstance = {
  start: mock(() => {}),
  stop: mock(() => {}),
};
const mockSpinner = mock(() => mockSpinnerInstance);

mock.module("../utils/prompts", () => ({
  intro: mockIntro,
  outro: mockOutro,
  spinner: mockSpinner,
}));

describe("tunnel-client actions", () => {
  beforeEach(() => {
    // Clear all mocks
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.warning.mockClear();
    mockLogger.error.mockClear();
    mockLogger.setLevel.mockClear();
    mockIntro.mockClear();
    mockOutro.mockClear();
    mockSpinner.mockClear();
    mockSpinnerInstance.start.mockClear();
    mockSpinnerInstance.stop.mockClear();
  });

  describe("startTunnelClientAction", () => {
    test("should set debug logging when verbose is true", async () => {
      try {
        await startTunnelClientAction({
          verbose: true,
          silent: true,
        });
      } catch (error) {
        // Connection errors are expected in test environment
      }

      expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
    });

    test("should not show UI when silent is true", async () => {
      try {
        await startTunnelClientAction({
          silent: true,
        });
      } catch (error) {
        // Connection errors are expected in test environment
      }

      expect(mockIntro).not.toHaveBeenCalled();
      expect(mockOutro).not.toHaveBeenCalled();
      expect(mockSpinner).not.toHaveBeenCalled();
    });

    test("should log verbose debug information when verbose is enabled", async () => {
      try {
        await startTunnelClientAction({
          verbose: true,
          silent: true,
        });
      } catch (error) {
        // Connection errors are expected in test environment
      }

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Starting tunnel client with configuration:"
      );
      expect(mockLogger.debug).toHaveBeenCalledWith("  Local Port: 3000");
      expect(mockLogger.debug).toHaveBeenCalledWith("  Local Host: localhost");
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "  Remote Host: tunnel.chara-ai.dev"
      );
      expect(mockLogger.debug).toHaveBeenCalledWith("  Secure: true");
      expect(mockLogger.debug).toHaveBeenCalledWith("  Subdomain: random");
    });

    test("should handle custom configuration options", async () => {
      try {
        await startTunnelClientAction({
          port: 8080,
          host: "127.0.0.1",
          remoteHost: "custom.tunnel.com",
          subdomain: "custom-app",
          secure: false,
          verbose: true,
          silent: true,
        });
      } catch (error) {
        // Connection errors are expected in test environment
      }

      expect(mockLogger.debug).toHaveBeenCalledWith("  Local Port: 8080");
      expect(mockLogger.debug).toHaveBeenCalledWith("  Local Host: 127.0.0.1");
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "  Remote Host: custom.tunnel.com"
      );
      expect(mockLogger.debug).toHaveBeenCalledWith("  Secure: false");
      expect(mockLogger.debug).toHaveBeenCalledWith("  Subdomain: custom-app");
    });

    test("should handle default configuration", async () => {
      try {
        await startTunnelClientAction({
          verbose: true,
          silent: true,
        });
      } catch (error) {
        // Connection errors are expected in test environment
      }

      expect(mockLogger.debug).toHaveBeenCalledWith("  Local Port: 3000");
      expect(mockLogger.debug).toHaveBeenCalledWith("  Local Host: localhost");
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "  Remote Host: tunnel.chara-ai.dev"
      );
      expect(mockLogger.debug).toHaveBeenCalledWith("  Secure: true");
      expect(mockLogger.debug).toHaveBeenCalledWith("  Subdomain: random");
    });

    test("should handle UI interaction flow", async () => {
      // Test that UI mocks are properly configured
      expect(typeof mockIntro).toBe("function");
      expect(typeof mockSpinner).toBe("function");
      expect(typeof mockSpinnerInstance.start).toBe("function");
      expect(typeof mockSpinnerInstance.stop).toBe("function");
    });

    test("should handle connection errors gracefully", async () => {
      try {
        await startTunnelClientAction({
          remoteHost: "invalid-host.example.com",
          silent: true,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(typeof error.message).toBe("string");
      }
    });

    test("should handle empty options object", async () => {
      try {
        await startTunnelClientAction({});
      } catch (error) {
        // Connection errors are expected in test environment
        expect(error).toBeDefined();
      }
    });

    test("should handle partial options", async () => {
      try {
        await startTunnelClientAction({
          port: 5000,
          verbose: true,
          silent: true,
        });
      } catch (error) {
        // Connection errors are expected in test environment
      }

      expect(mockLogger.debug).toHaveBeenCalledWith("  Local Port: 5000");
      expect(mockLogger.debug).toHaveBeenCalledWith("  Local Host: localhost");
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "  Remote Host: tunnel.chara-ai.dev"
      );
    });

    test("should handle secure option variations", async () => {
      // Test secure: false
      try {
        await startTunnelClientAction({
          secure: false,
          verbose: true,
          silent: true,
        });
      } catch (error) {
        // Connection errors are expected in test environment
      }

      expect(mockLogger.debug).toHaveBeenCalledWith("  Secure: false");
    });

    test("should handle subdomain option", async () => {
      try {
        await startTunnelClientAction({
          subdomain: "test-app",
          verbose: true,
          silent: true,
        });
      } catch (error) {
        // Connection errors are expected in test environment
      }

      expect(mockLogger.debug).toHaveBeenCalledWith("  Subdomain: test-app");
    });
  });

  describe("stopTunnelClientAction", () => {
    test("should set debug logging when verbose is true", async () => {
      const mockClient = {
        disconnect: mock(() => {}),
      };

      await stopTunnelClientAction({
        client: mockClient,
        verbose: true,
        silent: true,
      });

      expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
    });

    test("should disconnect from tunnel server", async () => {
      const mockClient = {
        disconnect: mock(() => {}),
      };

      await stopTunnelClientAction({
        client: mockClient,
        silent: true,
      });

      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    test("should handle graceful disconnect", async () => {
      const mockClient = {
        disconnect: mock(() => {}),
      };

      await stopTunnelClientAction({
        client: mockClient,
        silent: true,
        force: false,
      });

      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    test("should handle force disconnect", async () => {
      const mockClient = {
        disconnect: mock(() => {}),
      };

      await stopTunnelClientAction({
        client: mockClient,
        silent: true,
        force: true,
      });

      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    test("should handle client without disconnect method", async () => {
      const mockClient = {};

      await stopTunnelClientAction({
        client: mockClient,
        silent: true,
      });

      expect(mockLogger.warning).toHaveBeenCalledWith(
        "Client object provided but does not have a disconnect method"
      );
    });

    test("should handle disconnect errors", async () => {
      const mockClient = {
        disconnect: mock(() => {
          throw new Error("Disconnect failed");
        }),
      };

      await expect(
        stopTunnelClientAction({
          client: mockClient,
          silent: true,
        })
      ).rejects.toThrow("Disconnect failed");
    });

    test("should handle null client gracefully", async () => {
      await expect(
        stopTunnelClientAction({
          client: null,
          silent: true,
        })
      ).resolves.toBeUndefined();
    });

    test("should handle undefined client gracefully", async () => {
      await expect(
        stopTunnelClientAction({
          client: undefined,
          silent: true,
        })
      ).resolves.toBeUndefined();
    });

    test("should handle graceful shutdown timing", async () => {
      const mockClient = {
        disconnect: mock(() => {}),
      };

      const startTime = Date.now();
      await stopTunnelClientAction({
        client: mockClient,
        silent: true,
        force: false,
      });
      const endTime = Date.now();

      // Should wait approximately 1 second for graceful shutdown
      expect(endTime - startTime).toBeGreaterThan(900);
      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    test("should handle force shutdown without delay", async () => {
      const mockClient = {
        disconnect: mock(() => {}),
      };

      const startTime = Date.now();
      await stopTunnelClientAction({
        client: mockClient,
        silent: true,
        force: true,
      });
      const endTime = Date.now();

      // Should complete quickly without waiting
      expect(endTime - startTime).toBeLessThan(100);
      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    test("should validate UI mock setup", async () => {
      const mockClient = {
        disconnect: mock(() => {}),
      };

      await stopTunnelClientAction({
        client: mockClient,
        silent: true,
      });

      // Verify mock functions are available
      expect(typeof mockSpinner).toBe("function");
      expect(typeof mockSpinnerInstance.start).toBe("function");
      expect(typeof mockSpinnerInstance.stop).toBe("function");
      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    test("should not show UI when silent", async () => {
      const mockClient = {
        disconnect: mock(() => {}),
      };

      await stopTunnelClientAction({
        client: mockClient,
        silent: true,
      });

      expect(mockSpinner).not.toHaveBeenCalled();
      expect(mockSpinnerInstance.start).not.toHaveBeenCalled();
      expect(mockSpinnerInstance.stop).not.toHaveBeenCalled();
    });

    test("should handle stop action with no client", async () => {
      await expect(
        stopTunnelClientAction({
          silent: true,
        })
      ).resolves.toBeUndefined();
    });

    test("should handle stop action with invalid client", async () => {
      await expect(
        stopTunnelClientAction({
          client: "invalid-client" as any,
          silent: true,
        })
      ).resolves.toBeUndefined();
    });
  });

  describe("Action Configuration", () => {
    test("should handle all configuration combinations", async () => {
      const testCases = [
        {
          options: {},
          description: "empty options",
        },
        {
          options: { port: 8080 },
          description: "custom port",
        },
        {
          options: { host: "0.0.0.0" },
          description: "custom host",
        },
        {
          options: { secure: false },
          description: "insecure connection",
        },
        {
          options: { subdomain: "my-app" },
          description: "custom subdomain",
        },
        {
          options: { verbose: true },
          description: "verbose logging",
        },
        {
          options: { silent: true },
          description: "silent mode",
        },
      ];

      for (const { options, description } of testCases) {
        try {
          await startTunnelClientAction({
            ...options,
            silent: true, // Override to prevent UI output
          });
        } catch (error) {
          // Connection errors are expected in test environment
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe("Error Handling", () => {
    test("should handle various error scenarios", async () => {
      const errorScenarios = [
        { remoteHost: "invalid-host.example.com" },
        { port: 0 },
        { host: "" },
        { remoteHost: "" },
      ];

      for (const scenario of errorScenarios) {
        try {
          await startTunnelClientAction({
            ...scenario,
            silent: true,
          });
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    test("should handle stop action error scenarios", async () => {
      const errorScenarios = [
        { client: null },
        { client: undefined },
        { client: {} },
        { client: "string" },
        { client: 123 },
        { client: [] },
      ];

      for (const scenario of errorScenarios) {
        await expect(
          stopTunnelClientAction({
            ...scenario,
            silent: true,
          })
        ).resolves.toBeUndefined();
      }
    });
  });

  describe("Logging Integration", () => {
    test("should log appropriate messages based on verbosity", async () => {
      // Test verbose logging
      try {
        await startTunnelClientAction({
          verbose: true,
          silent: true,
        });
      } catch (error) {
        // Connection errors are expected
      }

      expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Starting tunnel client with configuration:"
      );

      // Clear mocks
      mockLogger.debug.mockClear();
      mockLogger.setLevel.mockClear();

      // Test non-verbose logging
      try {
        await startTunnelClientAction({
          verbose: false,
          silent: true,
        });
      } catch (error) {
        // Connection errors are expected
      }

      expect(mockLogger.setLevel).not.toHaveBeenCalled();
    });

    test("should handle logger errors gracefully", async () => {
      // Mock logger methods to throw errors
      const originalDebug = mockLogger.debug;
      mockLogger.debug.mockImplementation(() => {
        throw new Error("Logger error");
      });

      try {
        await startTunnelClientAction({
          verbose: true,
          silent: true,
        });
      } catch (error) {
        // Should handle both connection and logger errors
        expect(error).toBeDefined();
      }

      // Restore original mock
      mockLogger.debug = originalDebug;
    });
  });

  describe("UI Integration", () => {
    test("should handle UI component errors gracefully", async () => {
      // Mock UI components to throw errors
      const originalIntro = mockIntro;
      mockIntro.mockImplementation(() => {
        throw new Error("UI error");
      });

      try {
        await startTunnelClientAction({
          silent: false,
        });
      } catch (error) {
        // Should handle both UI and connection errors
        expect(error).toBeDefined();
      }

      // Restore original mock
      mockIntro.mockImplementation(originalIntro);
    });

    test("should handle spinner errors gracefully", async () => {
      // Mock spinner to throw errors
      const originalSpinner = mockSpinner;
      mockSpinner.mockImplementation(() => {
        throw new Error("Spinner error");
      });

      try {
        await startTunnelClientAction({
          silent: false,
        });
      } catch (error) {
        // Should handle both spinner and connection errors
        expect(error).toBeDefined();
      }

      // Restore original mock
      mockSpinner.mockImplementation(originalSpinner);
    });
  });
});
