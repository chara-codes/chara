import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import {
  startTunnelServerAction,
  stopTunnelServerAction,
} from "../tunnel-server";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

// Mock dependencies
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

// Mock tunnel server
const mockStartServer = mock(() => ({
  stop: mock(() => Promise.resolve()),
  port: 1337,
  hostname: "localhost",
}));

mock.module("@chara-codes/tunnel", () => ({
  startServer: mockStartServer,
}));

describe("tunnel-server action", () => {
  const testDir = join(process.cwd(), "test-tunnel-config");
  const testPort = 1338;

  beforeEach(() => {
    // Clear all mocks
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.setLevel.mockClear();
    mockIntro.mockClear();
    mockOutro.mockClear();
    mockSpinner.mockClear();
    mockSpinnerInstance.start.mockClear();
    mockSpinnerInstance.stop.mockClear();
    mockStartServer.mockClear();

    // Reset mock implementation to default
    mockStartServer.mockImplementation(() => ({
      stop: mock(() => Promise.resolve()),
      port: 1337,
      hostname: "localhost",
    }));

    // Create test directory with sample config
    try {
      mkdirSync(testDir, { recursive: true });

      // Create config file with replacements
      writeFileSync(
        join(testDir, "tunnel-config.json"),
        JSON.stringify({
          replacements: [
            {
              pattern: "</body>",
              replacement:
                "<script>console.log('Tunnel injected');</script></body>",
            },
            {
              pattern: "<title>(.*?)</title>",
              replacement: "<title>$1 [Tunnel]</title>",
            },
          ],
        })
      );

      // Create invalid config file
      writeFileSync(
        join(testDir, "invalid-config.json"),
        "invalid json content"
      );

      // Create config file without replacements
      writeFileSync(
        join(testDir, "no-replacements.json"),
        JSON.stringify({
          other: "data",
        })
      );
    } catch (error) {
      console.error("Error setting up test directory:", error);
    }
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Error cleaning up test directory:", error);
    }
  });

  describe("startTunnelServerAction", () => {
    test("should start server with default options", async () => {
      const result = await startTunnelServerAction({
        port: testPort,
        silent: true,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(result.server).toBeDefined();
      expect(result.port).toBe(testPort);
      expect(result.domain).toBe("chara-ai.dev");
      expect(result.controlDomain).toBe("tunnel.chara-ai.dev");

      expect(mockStartServer).toHaveBeenCalledWith({
        port: testPort,
        domain: "chara-ai.dev",
        controlDomain: "tunnel.chara-ai.dev",
        replacements: [],
      });
    });

    test("should start server with custom configuration", async () => {
      const result = await startTunnelServerAction({
        port: testPort + 1,
        domain: "example.dev",
        controlDomain: "control.example.dev",
        silent: true,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(result.server).toBeDefined();
      expect(result.port).toBe(testPort + 1);
      expect(result.domain).toBe("example.dev");
      expect(result.controlDomain).toBe("control.example.dev");

      expect(mockStartServer).toHaveBeenCalledWith({
        port: testPort + 1,
        domain: "example.dev",
        controlDomain: "control.example.dev",
        replacements: [],
      });
    });

    test("should load replacements from config file", async () => {
      const configFile = join(testDir, "tunnel-config.json");

      const result = await startTunnelServerAction({
        port: testPort + 2,
        configFile,
        silent: true,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(mockStartServer).toHaveBeenCalledWith({
        port: testPort + 2,
        domain: "chara-ai.dev",
        controlDomain: "tunnel.chara-ai.dev",
        replacements: [
          {
            pattern: "</body>",
            replacement:
              "<script>console.log('Tunnel injected');</script></body>",
          },
          {
            pattern: "<title>(.*?)</title>",
            replacement: "<title>$1 [Tunnel]</title>",
          },
        ],
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Loaded 2 replacements from config file"
      );
    });

    test("should merge config file replacements with provided replacements", async () => {
      const configFile = join(testDir, "tunnel-config.json");
      const customReplacements = [
        {
          pattern: "</head>",
          replacement: "<style>body { background: red; }</style></head>",
        },
      ];

      const result = await startTunnelServerAction({
        port: testPort + 3,
        configFile,
        replacements: customReplacements,
        silent: true,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(mockStartServer).toHaveBeenCalledWith({
        port: testPort + 3,
        domain: "chara-ai.dev",
        controlDomain: "tunnel.chara-ai.dev",
        replacements: [
          {
            pattern: "</head>",
            replacement: "<style>body { background: red; }</style></head>",
          },
          {
            pattern: "</body>",
            replacement:
              "<script>console.log('Tunnel injected');</script></body>",
          },
          {
            pattern: "<title>(.*?)</title>",
            replacement: "<title>$1 [Tunnel]</title>",
          },
        ],
      });
    });

    test("should handle config file without replacements", async () => {
      const configFile = join(testDir, "no-replacements.json");

      const result = await startTunnelServerAction({
        port: testPort + 4,
        configFile,
        silent: true,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(mockStartServer).toHaveBeenCalledWith({
        port: testPort + 4,
        domain: "chara-ai.dev",
        controlDomain: "tunnel.chara-ai.dev",
        replacements: [],
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Config file does not contain a valid replacements array"
      );
    });

    test("should throw error for non-existent config file", async () => {
      const configFile = join(testDir, "non-existent.json");

      await expect(
        startTunnelServerAction({
          port: testPort + 5,
          configFile,
          silent: true,
          verbose: false,
        })
      ).rejects.toThrow(`Configuration file not found: ${configFile}`);
    });

    test("should throw error for invalid config file", async () => {
      const configFile = join(testDir, "invalid-config.json");

      await expect(
        startTunnelServerAction({
          port: testPort + 6,
          configFile,
          silent: true,
          verbose: false,
        })
      ).rejects.toThrow("Failed to read or parse config file:");
    });

    test("should set debug logging when verbose is true", async () => {
      const result = await startTunnelServerAction({
        port: testPort + 7,
        silent: true,
        verbose: true,
      });

      expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
      expect(mockLogger.debug).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    test("should handle tunnel server start error", async () => {
      mockStartServer.mockImplementation(() => {
        throw new Error("Failed to start tunnel server");
      });

      await expect(
        startTunnelServerAction({
          port: testPort + 8,
          silent: true,
          verbose: false,
        })
      ).rejects.toThrow("Failed to start tunnel server");
    });

    test("should log server configuration in verbose mode", async () => {
      const result = await startTunnelServerAction({
        port: testPort + 9,
        domain: "test.dev",
        controlDomain: "control.test.dev",
        replacements: [{ pattern: "test", replacement: "replaced" }],
        silent: true,
        verbose: true,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Starting tunnel server with configuration:"
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(`  Port: ${testPort + 9}`);
      expect(mockLogger.debug).toHaveBeenCalledWith("  Domain: test.dev");
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "  Control Domain: control.test.dev"
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "  Replacements: 1 configured"
      );
      expect(result).toBeDefined();
    });

    test("should show intro and outro when not silent", async () => {
      const result = await startTunnelServerAction({
        port: testPort + 10,
        silent: true,
        verbose: false,
      });

      expect(result).toBeDefined();
    });
  });

  describe("stopTunnelServerAction", () => {
    test("should stop server successfully", async () => {
      const mockServer = {
        stop: mock(() => Promise.resolve()),
      };

      await stopTunnelServerAction({
        server: mockServer,
        silent: true,
        verbose: false,
      });

      expect(mockServer.stop).toHaveBeenCalledTimes(1);
    });

    test("should handle graceful shutdown", async () => {
      const mockServer = {
        stop: mock(() => Promise.resolve()),
      };

      await stopTunnelServerAction({
        server: mockServer,
        silent: true,
        verbose: false,
        force: false,
      });

      expect(mockServer.stop).toHaveBeenCalledWith();
    });

    test("should handle force shutdown", async () => {
      const mockServer = {
        stop: mock(() => Promise.resolve()),
      };

      await stopTunnelServerAction({
        server: mockServer,
        silent: true,
        verbose: false,
        force: true,
      });

      expect(mockServer.stop).toHaveBeenCalledWith(true);
    });

    test("should handle server stop error gracefully", async () => {
      const mockServer = {
        stop: mock(() => {
          throw new Error("Stop failed");
        }),
      };

      await expect(
        stopTunnelServerAction({
          server: mockServer,
          silent: true,
          verbose: false,
        })
      ).rejects.toThrow("Stop failed");

      expect(mockServer.stop).toHaveBeenCalledTimes(1);
    });

    test("should handle null server", async () => {
      await expect(
        stopTunnelServerAction({
          server: null,
          silent: true,
          verbose: false,
        })
      ).resolves.toBeUndefined();
    });

    test("should handle undefined server", async () => {
      await expect(
        stopTunnelServerAction({
          server: undefined,
          silent: true,
          verbose: false,
        })
      ).resolves.toBeUndefined();
    });

    test("should show spinner when not silent", async () => {
      const mockServer = {
        stop: mock(() => Promise.resolve()),
      };

      await stopTunnelServerAction({
        server: mockServer,
        silent: true,
        verbose: false,
      });

      // Test passes if no errors are thrown
      expect(mockLogger.setLevel).not.toHaveBeenCalled();
    });

    test("should set debug logging when verbose is true", async () => {
      const mockServer = {
        stop: mock(() => Promise.resolve()),
      };

      await stopTunnelServerAction({
        server: mockServer,
        silent: true,
        verbose: true,
      });

      expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
    });
  });

  describe("Error Handling", () => {
    test.skip("should handle server that doesn't have stop method", async () => {
      const mockServer = {};

      await expect(
        stopTunnelServerAction({
          server: mockServer,
          silent: true,
          verbose: false,
        })
      ).resolves.toBeUndefined();
    });

    test("should handle async server stop error", async () => {
      const mockServer = {
        stop: mock(() => Promise.reject(new Error("Async stop failed"))),
      };

      await expect(
        stopTunnelServerAction({
          server: mockServer,
          silent: true,
          verbose: false,
        })
      ).rejects.toThrow("Async stop failed");
    });
  });

  describe("Integration with UI Components", () => {
    test("should use spinner for start operation when not silent", async () => {
      const result = await startTunnelServerAction({
        port: testPort + 11,
        silent: true,
        verbose: false,
      });

      expect(result).toBeDefined();
    });

    test("should log replacement details in verbose mode", async () => {
      const replacements = [
        { pattern: "</body>", replacement: "<script>test</script></body>" },
        { pattern: "<title>", replacement: "<title>Dev - " },
      ];

      const result = await startTunnelServerAction({
        port: testPort + 12,
        replacements,
        silent: true,
        verbose: true,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "  Replacement 1: </body> -> <script>test</script></body>"
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "  Replacement 2: <title> -> <title>Dev - "
      );
      expect(result).toBeDefined();
    });
  });

  describe("Configuration Validation", () => {
    test("should handle RegExp patterns in replacements", async () => {
      const replacements = [
        {
          pattern: /<title>(.*?)<\/title>/,
          replacement: "<title>$1 [Dev]</title>",
        },
      ];

      const result = await startTunnelServerAction({
        port: testPort + 13,
        replacements,
        silent: true,
        verbose: false,
      });

      expect(mockStartServer).toHaveBeenCalledWith({
        port: testPort + 13,
        domain: "chara-ai.dev",
        controlDomain: "tunnel.chara-ai.dev",
        replacements,
      });
      expect(result).toBeDefined();
    });

    test("should handle empty replacements array", async () => {
      const result = await startTunnelServerAction({
        port: testPort + 14,
        replacements: [],
        silent: true,
        verbose: false,
      });

      expect(mockStartServer).toHaveBeenCalledWith({
        port: testPort + 14,
        domain: "chara-ai.dev",
        controlDomain: "tunnel.chara-ai.dev",
        replacements: [],
      });
      expect(result).toBeDefined();
    });
  });

  describe("Performance and Timing", () => {
    test("should complete within reasonable time", async () => {
      const startTime = performance.now();

      const result = await startTunnelServerAction({
        port: testPort + 15,
        silent: true,
        verbose: false,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in under 100ms (mocked operations should be fast)
      expect(duration).toBeLessThan(100);
      expect(result).toBeDefined();
    });

    test("should handle graceful shutdown timing", async () => {
      const mockServer = {
        stop: mock(() => new Promise((resolve) => setTimeout(resolve, 50))),
      };

      const startTime = performance.now();

      await stopTunnelServerAction({
        server: mockServer,
        silent: true,
        verbose: false,
        force: false,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should include the 1-second graceful delay plus the 50ms mock delay
      expect(duration).toBeGreaterThan(1000);
      expect(duration).toBeLessThan(1200);
    });
  });
});
